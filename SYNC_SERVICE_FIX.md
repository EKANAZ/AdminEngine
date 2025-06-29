# AdminEngine Sync Service - Complete Documentation

## Overview

The AdminEngine sync service provides a robust data synchronization system between client applications and the server. It supports multi-tenant architecture, conflict resolution, and real-time data synchronization for various entity types.

## Architecture

### Core Components

1. **SyncService**: Main service handling sync operations
2. **SyncRegistry**: Entity registry for dynamic entity resolution
3. **SyncController**: API endpoints for sync operations
4. **Entity Models**: ClientUser, Interaction, and other syncable entities

### Sync Flow

```
Client App ←→ Sync API ←→ SyncService ←→ Database
     ↑              ↑           ↑           ↑
  Local Data   HTTP Requests  Business   PostgreSQL
  Storage                    Logic       Storage
```

## Entity Registration

### SyncRegistry
The sync registry maps entity types to their corresponding TypeORM entity classes:

```typescript
export class SyncRegistry {
  private static entityMap: Record<string, any> = {
    'end_user': ClientUser,
    'interactions': Interaction,
  };

  static getEntityClass(entityType: string) {
    const entityClass = this.entityMap[entityType];
    if (!entityClass) throw new Error(`Entity type ${entityType} not registered`);
    return entityClass;
  }
}
```

### Supported Entities

#### ClientUser (`end_user`)
- **Table**: `end_user`
- **Sync Fields**: `sync_status`, `server_synced`, `last_updated`, `version`
- **Deletion**: Soft delete using `is_deleted` (0 = active, 1 = deleted)
- **Status**: `active` field (1 = active, 0 = inactive)

#### Interaction (`interactions`)
- **Table**: `interactions`
- **Sync Fields**: Standard timestamp fields
- **Deletion**: Uses status field ('pending', 'completed', 'cancelled')
- **Relations**: Links to ClientUser via `client_user_id`

## Sync Operations

### 1. Push Changes (Client → Server)

Pushes local changes from client to server with conflict resolution.

#### API Endpoint
```
POST /api/client/sync/push
```

#### Request Format
```json
{
  "changes": {
    "end_user": [
      {
        "id": "uuid-or-null",
        "name": "John Doe",
        "email": "john@example.com",
        "sync_status": "pending",
        "server_synced": 0,
        "version": 1
      }
    ],
    "interactions": [
      {
        "id": "uuid-or-null",
        "type": "call",
        "title": "Follow up call",
        "description": "Discuss project details",
        "date": "2024-01-01T10:00:00Z",
        "status": "pending"
      }
    ]
  }
}
```

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "generated-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "sync_status": "synced",
      "server_synced": 1,
      "last_updated": "2024-01-01T12:00:00.000Z",
      "version": 2
    }
  ],
  "syncTimestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Implementation Details

```typescript
async pushChanges(tenantId: string, changes: SyncChange[]): Promise<any> {
  const results: any[] = [];
  const queryRunner = this.dataSource.createQueryRunner();
  
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    for (const change of changes) {
      const repo = this.getRepository(change.entityType);
      const entityData = this.transformEntityData(change.entityType, { ...change.data });
      
      let entity = null;
      
      // Handle existing vs new entities
      if (entityData.id && /^[0-9a-fA-F-]{36}$/.test(entityData.id)) {
        entity = await repo.findOne({ where: { id: entityData.id } });
      } else {
        delete entityData.id; // Let TypeORM generate new ID
      }
      
      if (entity) {
        // Update existing entity with conflict resolution
        entity = this.resolveConflict(entity, entityData);
        entity = this.updateSyncStatus(entity, change.entityType, 'synced');
        await repo.save(entity);
      } else {
        // Create new entity
        entity = repo.create(entityData);
        entity = this.updateSyncStatus(entity, change.entityType, 'synced');
        await repo.save(entity);
      }
      
      results.push(entity);
    }
    
    await queryRunner.commitTransaction();
    return {
      success: true,
      data: results,
      syncTimestamp: new Date().toISOString(),
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

### 2. Pull Data (Server → Client)

Pulls data from server to client based on last sync timestamp.

#### API Endpoint
```
POST /api/client/sync/pull
```

#### Request Format
```json
{
  "lastSyncTimestamp": "2024-01-01T00:00:00.000Z",
  "entityTypes": ["end_user", "interactions"]
}
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "end_user": [
      {
        "id": "uuid",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "sync_status": "synced",
        "updatedAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "interactions": [
      {
        "id": "uuid",
        "type": "meeting",
        "title": "Project Review",
        "status": "completed",
        "updatedAt": "2024-01-01T12:00:00.000Z"
      }
    ]
  },
  "syncTimestamp": "2024-01-01T12:00:00.000Z"
}
```

### 3. Pull Pending Data (Server → Client)

Pulls only pending sync items from server.

#### API Endpoint
```
POST /api/client/sync/pull-pending
```

#### Request Format
```json
{
  "entityTypes": ["end_user", "interactions"]
}
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "end_user": [
      {
        "id": "uuid",
        "name": "New User",
        "email": "new@example.com",
        "sync_status": "pending"
      }
    ]
  },
  "syncTimestamp": "2024-01-01T12:00:00.000Z"
}
```

## Data Transformation

### Entity-Specific Transformations

```typescript
private transformEntityData(entityType: string, data: any): any {
  switch (entityType) {
    case 'end_user':
      // Transform isDeleted boolean to is_deleted number
      if (data.isDeleted !== undefined) {
        data.is_deleted = data.isDeleted ? 1 : 0;
        delete data.isDeleted;
      }
      
      // Set defaults
      if (data.active === undefined) data.active = 1;
      if (data.server_synced === undefined) data.server_synced = 0;
      if (data.version === undefined) data.version = 1;
      break;
    
    case 'interactions':
      if (data.status === undefined) data.status = 'pending';
      break;
  }
  
  return data;
}
```

### Sync Status Updates

```typescript
private updateSyncStatus(entity: any, entityType: string, status: string): any {
  switch (entityType) {
    case 'end_user':
      entity.sync_status = status;
      if (entity.hasOwnProperty('server_synced')) {
        entity.server_synced = status === 'synced' ? 1 : 0;
      }
      entity.last_updated = new Date().toISOString();
      break;
    
    case 'interactions':
      if (entity.hasOwnProperty('sync_status')) {
        entity.sync_status = status;
      }
      break;
  }
  
  entity.updatedAt = new Date();
  return entity;
}
```

## Conflict Resolution

The sync service supports multiple conflict resolution strategies:

### Available Strategies

1. **server-wins**: Server data takes precedence
2. **client-wins**: Client data takes precedence
3. **last-write-wins**: Most recent update wins
4. **merge**: Combine server and client data

### Implementation

```typescript
private resolveConflict(server: any, client: any): any {
  switch (this.conflictResolution) {
    case 'server-wins':
      return { ...server, updatedAt: new Date() };
    
    case 'client-wins':
      return { ...client, version: server.version + 1, updatedAt: new Date() };
    
    case 'last-write-wins':
      return server.updatedAt > client.updatedAt 
        ? server 
        : { ...client, version: server.version + 1 };
    
    case 'merge':
      return { 
        ...server, 
        ...client, 
        version: server.version + 1, 
        updatedAt: new Date() 
      };
    
    default:
      throw new Error(`Unknown conflict resolution strategy: ${this.conflictResolution}`);
  }
}
```

## Query Building

### Entity-Specific Queries

```typescript
private buildWhereClause(entityType: string, tenantId: string, lastSync: Date): any {
  const entityConfigs: Record<string, any> = {
    'end_user': {
      updatedAt: MoreThan(lastSync),
      is_deleted: 0
    },
    'interactions': {
      updatedAt: MoreThan(lastSync)
    }
  };

  return entityConfigs[entityType] || {
    updatedAt: MoreThan(lastSync),
    isDeleted: false
  };
}
```

### Pending Data Queries

```typescript
private buildPendingWhereClause(entityType: string): any {
  const entityConfigs: Record<string, any> = {
    'end_user': {
      is_deleted: 0,
      sync_status: 'pending'
    },
    'interactions': {
      // No sync status filter for interactions
    }
  };

  return entityConfigs[entityType] || {
    isDeleted: false
  };
}
```

## Error Handling

### Graceful Error Handling

```typescript
async pullData(tenantId: string, lastSync: Date, entityTypes: string[]): Promise<any> {
  const result: any = {};
  
  for (const entityType of entityTypes) {
    try {
      const repo = this.getRepository(entityType);
      const whereClause = this.buildWhereClause(entityType, tenantId, lastSync);
      
      logger.info(`Pulling data for entity type: ${entityType}`, { whereClause });
      
      const data = await repo.find({
        where: whereClause,
        order: { updatedAt: 'DESC' },
      });
      
      result[entityType] = data;
      logger.info(`Successfully pulled ${data.length} records for entity type: ${entityType}`);
    } catch (error) {
      logger.error(`Error pulling data for entity type: ${entityType}`, error);
      // Continue with other entity types instead of failing completely
      result[entityType] = [];
    }
  }
  
  return {
    success: true,
    data: result,
    syncTimestamp: new Date().toISOString(),
  };
}
```

## Sync Status Values

### Status Definitions

- **`'pending'`**: Data needs to be synced to server
- **`'synced'`**: Data has been successfully synced to server
- **`'failed'`**: Sync attempt failed (future implementation)
- **`'conflict'`**: Sync conflict detected (future implementation)

### Status Flow

```
Local Create/Update → pending → Push to Server → synced
                                    ↓
                              Conflict? → conflict
                                    ↓
                              Error? → failed
```

## Client-Side Implementation

### Basic Sync Client

```typescript
class SyncClient {
  private baseUrl: string;
  private token: string;
  private lastSyncTimestamp: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.lastSyncTimestamp = new Date(0).toISOString();
  }

  async pushChanges(changes: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/client/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ changes })
    });

    const result = await response.json();
    
    if (result.success) {
      this.lastSyncTimestamp = result.syncTimestamp;
    }
    
    return result;
  }

  async pullData(entityTypes: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/client/sync/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        lastSyncTimestamp: this.lastSyncTimestamp,
        entityTypes
      })
    });

    const result = await response.json();
    
    if (result.success) {
      this.lastSyncTimestamp = result.syncTimestamp;
    }
    
    return result;
  }

  async pullPendingData(entityTypes: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/client/sync/pull-pending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ entityTypes })
    });

    return await response.json();
  }
}
```

### Usage Example

```typescript
const syncClient = new SyncClient('http://localhost:3000', 'your-jwt-token');

// Push local changes
const localChanges = {
  end_user: [
    {
      name: 'John Doe',
      email: 'john@example.com',
      sync_status: 'pending'
    }
  ]
};

const pushResult = await syncClient.pushChanges(localChanges);
console.log('Push result:', pushResult);

// Pull server changes
const pullResult = await syncClient.pullData(['end_user', 'interactions']);
console.log('Pull result:', pullResult);

// Check pending items
const pendingResult = await syncClient.pullPendingData(['end_user']);
console.log('Pending items:', pendingResult);
```

## Testing

### Unit Tests

```typescript
describe('SyncService', () => {
  let syncService: SyncService;
  let mockDataSource: any;

  beforeEach(() => {
    mockDataSource = {
      createQueryRunner: jest.fn(),
      getRepository: jest.fn()
    };
    syncService = new SyncService(mockDataSource);
  });

  test('should push changes successfully', async () => {
    const changes = [{
      entityType: 'end_user',
      data: {
        name: 'Test User',
        email: 'test@example.com',
        sync_status: 'pending'
      }
    }];

    const result = await syncService.pushChanges('tenant-1', changes);
    
    expect(result.success).toBe(true);
    expect(result.data[0].sync_status).toBe('synced');
  });

  test('should pull data with correct filters', async () => {
    const lastSync = new Date('2024-01-01');
    const entityTypes = ['end_user'];
    
    const result = await syncService.pullData('tenant-1', lastSync, entityTypes);
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('end_user');
  });
});
```

### Integration Tests

```typescript
describe('Sync API Integration', () => {
  test('should handle complete sync flow', async () => {
    // 1. Push changes
    const pushResponse = await request(app)
      .post('/api/client/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        changes: {
          end_user: [{
            name: 'Integration Test User',
            email: 'integration@test.com',
            sync_status: 'pending'
          }]
        }
      });

    expect(pushResponse.status).toBe(200);
    expect(pushResponse.body.success).toBe(true);
    expect(pushResponse.body.data[0].sync_status).toBe('synced');

    // 2. Pull data
    const pullResponse = await request(app)
      .post('/api/client/sync/pull')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lastSyncTimestamp: new Date(0).toISOString(),
        entityTypes: ['end_user']
      });

    expect(pullResponse.status).toBe(200);
    expect(pullResponse.body.success).toBe(true);
    expect(pullResponse.body.data.end_user).toHaveLength(1);
  });
});
```

## Performance Considerations

### Batch Processing
- Process changes in batches to avoid memory issues
- Use transactions for data consistency
- Implement pagination for large datasets

### Caching
- Cache frequently accessed entities
- Use Redis for distributed caching
- Implement query result caching

### Monitoring
- Log sync operations for debugging
- Monitor sync performance metrics
- Track sync conflicts and errors

## Security

### Authentication
- All sync endpoints require JWT authentication
- Validate user permissions for each entity type
- Implement rate limiting for sync operations

### Data Validation
- Validate all incoming data
- Sanitize data before database operations
- Implement input size limits

### Audit Trail
- Log all sync operations
- Track data changes and conflicts
- Maintain sync history

## Future Enhancements

### Planned Features
1. **Real-time Sync**: WebSocket-based real-time synchronization
2. **Offline Support**: Queue-based offline sync operations
3. **Conflict Resolution UI**: User interface for resolving conflicts
4. **Sync Analytics**: Detailed sync performance analytics
5. **Multi-device Sync**: Support for multiple client devices
6. **Selective Sync**: Sync only specific data subsets

### Scalability Improvements
1. **Database Sharding**: Distribute sync data across multiple databases
2. **Message Queues**: Use message queues for async sync processing
3. **CDN Integration**: Cache static sync data on CDN
4. **Microservices**: Split sync service into microservices

## Troubleshooting

### Common Issues

1. **Sync Status Stuck on Pending**
   - Check if sync service is running
   - Verify database connectivity
   - Check for transaction rollbacks

2. **Data Conflicts**
   - Review conflict resolution strategy
   - Check entity version numbers
   - Verify timestamp accuracy

3. **Performance Issues**
   - Monitor database query performance
   - Check for large data sets
   - Review indexing strategy

### Debug Tools

```typescript
// Enable debug logging
logger.setLevel('debug');

// Monitor sync operations
syncService.on('sync', (data) => {
  console.log('Sync operation:', data);
});

// Check sync status
const pendingData = await syncService.pullPendingData(['end_user']);
console.log('Pending items:', pendingData);
```

## Conclusion

The AdminEngine sync service provides a robust, scalable solution for data synchronization between client applications and the server. With proper conflict resolution, error handling, and performance optimizations, it can handle complex sync scenarios while maintaining data consistency and integrity.

The modular design allows for easy extension and customization, while the comprehensive error handling ensures reliable operation in production environments.
