import { Request, Response } from 'express';
import { SyncService } from '../../services/sync.service';
import { App } from '../../core/Application';
import { pullDataSchema, pushDataSchema, pushBatchDataSchema } from '../../validations/client/sync.validation';
import { getTenantDataSource, createTenantDatabase } from '../../config/database';

export class SyncController {
  private app?: App;

  constructor(app?: App) {
    this.app = app;
  }

  // Helper method to ensure tenant database exists
  private async ensureTenantDatabase(tenantId: string): Promise<any> {
    try {
      console.log('Getting tenant data source for:', tenantId);
      const dataSource = getTenantDataSource(tenantId);
      await dataSource.initialize();
      console.log('Tenant data source initialized successfully');
      return dataSource;
    } catch (error: any) {
      console.log('Tenant database not found, attempting to create:', error.message);
      try {
        await createTenantDatabase(tenantId);
        console.log('Tenant database created successfully');
        const dataSource = getTenantDataSource(tenantId);
        await dataSource.initialize();
        console.log('New tenant data source initialized successfully');
        return dataSource;
      } catch (createError: any) {
        console.error('Failed to create tenant database:', createError);
        throw new Error(`Failed to initialize tenant database: ${createError.message}`);
      }
    }
  }

  // Helper method to send WebSocket notifications
  private sendNotification(tenantId: string, notification: any) {
    if (this.app) {
      this.app.sendNotificationToTenant(tenantId, notification);
    }
  }

  // Pull data from server to client
  async pullData(req: Request, res: Response) {
    console.log('SYNC PULL HEADERS:', req.headers);
    console.log('SYNC PULL BODY:', req.body);
    console.log('SYNC PULL USER:', (req as any).user);
    
    const { error } = pullDataSchema.validate(req.body);
    if (error) {
      console.error('Pull validation error:', error.message);
      return res.status(400).json({ success: false, error: error.message });
    }
    
    let dataSource;
    try {
      const user = req.user as any;
      console.log('User object:', user);
      const companyId = user?.companyId || user?.customerId;
      console.log('Company/Customer ID:', companyId);
      
      if (!companyId) {
        console.error('No companyId or customerId found in user object');
        return res.status(401).json({ success: false, error: 'Unauthorized - No company/customer ID' });
      }
      
      // Handle both old and new formats
      let lastSyncTimestamp: string;
      let entityTypes: string[];
      
      if (req.body.lastSyncTimestamp && req.body.entityTypes) {
        // New format (batch pull)
        lastSyncTimestamp = req.body.lastSyncTimestamp;
        entityTypes = req.body.entityTypes;
        console.log('Using new format - batch pull');
      } else if (req.body.table && req.body.lastSync) {
        // Old format (single entity pull)
        lastSyncTimestamp = req.body.lastSync;
        entityTypes = [req.body.table];
        console.log('Using old format - single entity pull');
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid request format. Must provide either (lastSyncTimestamp, entityTypes) or (table, lastSync)' 
        });
      }
      
      console.log('Getting tenant data source for:', companyId);
      dataSource = await this.ensureTenantDatabase(companyId.toString());
      console.log('Tenant data source initialized successfully');
      
      const syncService = new SyncService(dataSource, 'server-wins', this.app);
      console.log('Pulling data with params:', { lastSyncTimestamp, entityTypes });
      const result = await syncService.pullData(companyId.toString(), new Date(lastSyncTimestamp), entityTypes);
      console.log('Pull operation completed successfully:', result);
      res.json(result);
    } catch (err: any) {
      console.error('Sync pullData error:', err);
      res.status(500).json({ success: false, error: err.message });
    } finally {
      if (dataSource) {
        try {
          await dataSource.destroy();
          console.log('Tenant data source destroyed');
        } catch (err) {
          console.error('Error destroying data source:', err);
        }
      }
    }
  }

  // Pull pending data from server to client (items that need syncing)
  async pullPendingData(req: Request, res: Response) {
    console.log('SYNC PULL-PENDING HEADERS:', req.headers);
    console.log('SYNC PULL-PENDING BODY:', req.body);
    console.log('SYNC PULL-PENDING USER:', (req as any).user);
    
    const { error } = pullDataSchema.validate(req.body);
    if (error) {
      console.error('Pull pending validation error:', error.message);
      return res.status(400).json({ success: false, error: error.message });
    }
    
    let dataSource;
    try {
      const user = req.user as any;
      console.log('User object:', user);
      const companyId = user?.companyId || user?.customerId;
      console.log('Company/Customer ID:', companyId);
      
      if (!companyId) {
        console.error('No companyId or customerId found in user object');
        return res.status(401).json({ success: false, error: 'Unauthorized - No company/customer ID' });
      }
      
      // Handle both old and new formats
      let entityTypes: string[];
      
      if (req.body.entityTypes) {
        // New format (batch pull)
        entityTypes = req.body.entityTypes;
        console.log('Using new format - batch pull pending');
      } else if (req.body.table) {
        // Old format (single entity pull)
        entityTypes = [req.body.table];
        console.log('Using old format - single entity pull pending');
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid request format. Must provide either entityTypes or table' 
        });
      }
      
      console.log('Getting tenant data source for:', companyId);
      dataSource = await this.ensureTenantDatabase(companyId.toString());
      console.log('Tenant data source initialized successfully');
      
      const syncService = new SyncService(dataSource, 'server-wins', this.app);
      console.log('Pulling pending data with params:', { entityTypes });
      const result = await syncService.pullPendingData(companyId.toString(), entityTypes);
      console.log('Pull pending operation completed successfully:', result);
      res.json(result);
    } catch (err: any) {
      console.error('Sync pullPendingData error:', err);
      res.status(500).json({ success: false, error: err.message });
    } finally {
      if (dataSource) {
        try {
          await dataSource.destroy();
          console.log('Tenant data source destroyed');
        } catch (err) {
          console.error('Error destroying data source:', err);
        }
      }
    }
  }

  // Push data from client to server
  async pushData(req: Request, res: Response) {
    console.log('SYNC PUSH HEADERS:', req.headers);
    console.log('SYNC PUSH BODY:', req.body);
    console.log('SYNC PUSH USER:', (req as any).user);
    
    // Try both validation schemas
    let validationError = pushDataSchema.validate(req.body).error;
    let isBatchOperation = false;
    
    if (validationError) {
      // Try batch schema
      const batchValidation = pushBatchDataSchema.validate(req.body);
      if (batchValidation.error) {
        console.error('Push validation error:', validationError.message);
        console.error('Batch validation error:', batchValidation.error.message);
        return res.status(400).json({ success: false, error: validationError.message });
      }
      isBatchOperation = true;
    }
    
    let dataSource;
    try {
      const user = req.user as any;
      console.log('User object:', user);
      const companyId = user?.companyId || user?.customerId;
      console.log('Company/Customer ID:', companyId);
      
      if (!companyId) {
        console.error('No companyId or customerId found in user object');
        return res.status(401).json({ success: false, error: 'Unauthorized - No company/customer ID' });
      }
      
      console.log('Getting tenant data source for:', companyId);
      dataSource = await this.ensureTenantDatabase(companyId.toString());
      console.log('Tenant data source initialized successfully');
      
      const syncService = new SyncService(dataSource, 'server-wins', this.app);
      
      let result;
      if (isBatchOperation) {
        // Handle batch operation (multiple entities)
        const changes: any[] = [];
        for (const [entityType, entityArray] of Object.entries(req.body.changes)) {
          for (const entity of entityArray as any[]) {
            changes.push({ entityType, data: entity });
          }
        }
        console.log('Processing batch changes:', changes);
        result = await syncService.pushChanges(companyId.toString(), changes);
      } else {
        // Handle single entity operation
        const { table, operation, data, timestamp } = req.body;
        const change = {
          entityType: table,
          operation: operation,
          data: data,
          timestamp: timestamp
        };
        console.log('Processing single change:', change);
        result = await syncService.pushChanges(companyId.toString(), [change]);
      }
      
      console.log('Sync operation completed successfully:', result);
      res.json(result);
    } catch (err: any) {
      console.error('Sync pushData error:', err);
      res.status(500).json({ success: false, error: err.message });
    } finally {
      if (dataSource) {
        try {
          await dataSource.destroy();
          console.log('Tenant data source destroyed');
        } catch (err) {
          console.error('Error destroying data source:', err);
        }
      }
    }
  }
} 