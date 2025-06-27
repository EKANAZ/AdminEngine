import { Request, Response } from 'express';
import { SyncService } from '../../services/sync.service';
import { pullDataSchema, pushDataSchema } from '../../validations/client/sync.validation';
import { getTenantDataSource } from '../../config/database';

export class SyncController {
  // Pull data from server to client
  async pullData(req: Request, res: Response) {
    const { error } = pullDataSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.message });
    try {
      const { lastSyncTimestamp, entityTypes } = req.body;
      const user = req.user as any;
      const companyId = user?.companyId;
      if (!companyId) return res.status(401).json({ success: false, error: 'Unauthorized' });
      const dataSource = getTenantDataSource(companyId.toString());
      const syncService = new SyncService(dataSource);
      const result = await syncService.pullData(companyId.toString(), new Date(lastSyncTimestamp), entityTypes);
      res.json(result);
    } catch (err: any) {
      console.error('Sync pullData error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Push data from client to server
  async pushData(req: Request, res: Response) {
    res.json({ success: true, message: "Minimal push endpoint is working!" });
  }
} 