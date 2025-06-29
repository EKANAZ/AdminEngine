import { DataSource, QueryRunner, Repository, MoreThan } from 'typeorm';
import { SyncRegistry } from '../core/sync/SyncRegistry';
import { App } from '../core/Application';
import logger from '../config/logger';

export interface SyncChange {
  entityType: string;
  data: any;
}

export class SyncService {
  private dataSource: DataSource;
  private conflictResolution: 'server-wins' | 'client-wins' | 'last-write-wins' | 'merge';
  private app?: App;

  constructor(
    dataSource: DataSource,
    conflictResolution: 'server-wins' | 'client-wins' | 'last-write-wins' | 'merge' = 'server-wins',
    app?: App
  ) {
    this.dataSource = dataSource;
    this.conflictResolution = conflictResolution;
    this.app = app;
  }

  // Set app instance after construction
  public setApp(app: App) {
    this.app = app;
  }

  // Universal push: accepts a flat array of changes
  async pushChanges(tenantId: string, changes: SyncChange[]): Promise<any> {
    const results: any[] = [];
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    console.log('Pushing changes:', changes);
    
    try {
      for (const change of changes) {
        console.log(`Processing change for entity type: ${change.entityType}`);
        console.log('Original data:', change.data);
        
        const repo = this.getRepository(change.entityType);
        const entityData = this.transformEntityData(change.entityType, { ...change.data });
        console.log('Transformed data:', entityData);
        
        let entity = null;
        
        // Only try to find if id is present and is a valid UUID
        if (entityData.id && /^[0-9a-fA-F-]{36}$/.test(entityData.id)) {
          console.log('Looking for existing entity with ID:', entityData.id);
          entity = await repo.findOne({ where: { id: entityData.id } });
          console.log('Found existing entity:', entity ? 'Yes' : 'No');
        } else {
          // Remove invalid id so TypeORM/Postgres can generate a new one
          console.log('Removing invalid ID for new entity creation');
          delete entityData.id;
        }
        
        if (entity) {
          // Conflict resolution
          console.log('Updating existing entity');
          entity = this.resolveConflict(entity, entityData);
          entity = this.updateSyncStatus(entity, change.entityType, 'synced');
          await repo.save(entity);
          
          // Notify other clients about sync completion
          if (this.app) {
            this.app.notifySyncComplete(
              tenantId, 
              change.entityType, 
              entity.id,
              entity
            );
          }
        } else {
          console.log('Creating new entity');
          entity = repo.create(entityData);
          entity = this.updateSyncStatus(entity, change.entityType, 'synced');
          console.log('Entity to save:', entity);
          await repo.save(entity);
          
          // Notify other clients about new data
          if (this.app) {
            this.app.notifyDataAvailable(
              tenantId, 
              change.entityType, 
              entity.id
            );
          }
        }
        
        results.push(entity);
        console.log(`Successfully processed ${change.entityType} entity`);
      }
      
      await queryRunner.commitTransaction();
      console.log('Transaction committed successfully');
      
      // Notify about successful sync operation
      if (this.app) {
        this.app.notifySyncComplete(tenantId, 'batch', undefined, {
          count: results.length,
          entityTypes: [...new Set(changes.map(c => c.entityType))]
        });
      }
      
      return {
        success: true,
        data: results,
        syncTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Push data error:', error);
      logger.error('Push data error:', error);
      
      // Notify about sync error
      if (this.app) {
        this.app.notifySyncError(
          tenantId, 
          'batch', 
          (error as Error).message || 'Unknown error'
        );
      }
      
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Universal pull: get all entities of given types updated after lastSync
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

  private buildWhereClause(entityType: string, tenantId: string, lastSync: Date): any {
    // Define entity-specific where clauses
    const entityConfigs: Record<string, any> = {
      'end_user': {
        updatedAt: MoreThan(lastSync),
        is_deleted: 0 // ClientUser uses is_deleted as number
      },
      'interactions': {
        updatedAt: MoreThan(lastSync)
        // Interactions don't have deletion flag
      }
    };

    // Return the appropriate where clause for the entity type
    return entityConfigs[entityType] || {
      updatedAt: MoreThan(lastSync),
      isDeleted: false // Default for entities with standard deletion flag
    };
  }

  // Pull only pending sync items (for client to check what needs to be synced)
  async pullPendingData(tenantId: string, entityTypes: string[]): Promise<any> {
    const result: any = {};
    for (const entityType of entityTypes) {
      try {
        const repo = this.getRepository(entityType);
        const whereClause = this.buildPendingWhereClause(entityType);
        
        logger.info(`Pulling pending data for entity type: ${entityType}`, { whereClause });
        
        const data = await repo.find({
          where: whereClause,
          order: { updatedAt: 'DESC' },
        });
        
        result[entityType] = data;
        logger.info(`Successfully pulled ${data.length} pending records for entity type: ${entityType}`);
      } catch (error) {
        logger.error(`Error pulling pending data for entity type: ${entityType}`, error);
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

  private buildPendingWhereClause(entityType: string): any {
    // Define entity-specific where clauses for pending sync items
    const entityConfigs: Record<string, any> = {
      'end_user': {
        is_deleted: 0, // ClientUser uses is_deleted as number
        sync_status: 'pending' // Only pull pending sync items
      },
      'interactions': {
        // Interactions don't have sync status, so pull all
      }
    };

    // Return the appropriate where clause for the entity type
    return entityConfigs[entityType] || {
      isDeleted: false // Default for entities with standard deletion flag
    };
  }

  private getRepository(entityType: string): Repository<any> {
    const entityClass = SyncRegistry.getEntityClass(entityType);
    return this.dataSource.getRepository(entityClass);
  }

  private resolveConflict(server: any, client: any): any {
    switch (this.conflictResolution) {
      case 'server-wins':
        return { ...server, updatedAt: new Date() };
      case 'client-wins':
        return { ...client, version: server.version + 1, updatedAt: new Date() };
      case 'last-write-wins':
        return server.updatedAt > client.updatedAt ? server : { ...client, version: server.version + 1 };
      case 'merge':
        return { ...server, ...client, version: server.version + 1, updatedAt: new Date() };
      default:
        throw new Error(`Unknown conflict resolution strategy: ${this.conflictResolution}`);
    }
  }

  private transformEntityData(entityType: string, data: any): any {
    // Handle entity-specific data transformations
    switch (entityType) {
      case 'end_user':
        // Transform isDeleted boolean to is_deleted number for ClientUser
        if (data.isDeleted !== undefined) {
          data.is_deleted = data.isDeleted ? 1 : 0;
          delete data.isDeleted;
        }
        // Ensure active field is set
        if (data.active === undefined) {
          data.active = 1;
        }
        // Ensure email is present (required field)
        if (!data.email) {
          throw new Error('Email is required for ClientUser');
        }
        // Handle sync status - if client sends pending, we'll update it to synced after save
        if (data.sync_status === 'pending') {
          // Keep it as pending initially, will be updated after successful save
        }
        // Handle server_synced flag
        if (data.server_synced === undefined) {
          data.server_synced = 0; // Default to not synced
        }
        // Ensure version is set
        if (data.version === undefined) {
          data.version = 1;
        }
        // Handle timestamps - if createdAt is null, set it to current time for new entities
        if (data.createdAt === null || data.createdAt === undefined) {
          data.createdAt = new Date();
        }
        // Always set updatedAt to current time
        data.updatedAt = new Date();
        // Ensure last_updated is set
        if (!data.last_updated) {
          data.last_updated = new Date().toISOString();
        }
        break;
      
      case 'interactions':
        // Handle any Interaction-specific transformations
        if (data.status === undefined) {
          data.status = 'pending';
        }
        // Handle timestamps for interactions
        if (data.createdAt === null || data.createdAt === undefined) {
          data.createdAt = new Date();
        }
        data.updatedAt = new Date();
        break;
      
      default:
        // Default transformation for other entities
        // Handle timestamps for all entities
        if (data.createdAt === null || data.createdAt === undefined) {
          data.createdAt = new Date();
        }
        data.updatedAt = new Date();
        break;
    }
    
    return data;
  }

  private updateSyncStatus(entity: any, entityType: string, status: string): any {
    // Update sync status based on entity type
    switch (entityType) {
      case 'end_user':
        // ClientUser has sync_status field
        entity.sync_status = status;
        // Also update server_synced flag if it exists
        if (entity.hasOwnProperty('server_synced')) {
          entity.server_synced = status === 'synced' ? 1 : 0;
        }
        // Update last_updated timestamp
        entity.last_updated = new Date().toISOString();
        break;
      
      case 'interactions':
        // Interactions might not have sync_status, but we can add it if needed
        if (entity.hasOwnProperty('sync_status')) {
          entity.sync_status = status;
        }
        break;
      
      default:
        // For other entities, try to update sync_status if it exists
        if (entity.hasOwnProperty('sync_status')) {
          entity.sync_status = status;
        }
        break;
    }
    
    // Always update the updatedAt timestamp
    entity.updatedAt = new Date();
    
    return entity;
  }
}

// COMMENT: This refactored SyncService uses a registry-based universal syncing logic. It supports syncing any registered entity type, handles conflict resolution, and is ready for multi-tenant, multi-entity sync APIs. 