import { Request, Response } from 'express';
import { ClientService } from '../services/client.service';
import { getTenantDataSource } from '../config/database';
import logger from '../config/logger';

export class ClientController {
    private clientService: ClientService;

    constructor() {
        this.clientService = new ClientService();
    }

    // Client login
    async login(req: Request, res: Response) {
        try {
            const { email, password, companyDomain } = req.body;
            const result = await this.clientService.login(email, password, companyDomain);
            res.json(result);
        } catch (error) {
            logger.error('Client login error:', error);
            res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
    }

    // Pull data from server to client
    async pullData(req: Request, res: Response) {
        try {
            const { lastSyncTimestamp, entityTypes } = req.body;
            const userId = req.user.id;
            const companyId = req.user.companyId;

            const tenantDataSource = getTenantDataSource(companyId.toString());
            const result = await this.clientService.pullData(
                tenantDataSource,
                userId,
                lastSyncTimestamp,
                entityTypes
            );

            res.json({
                success: true,
                data: result,
                syncTimestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Pull data error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to pull data' 
            });
        }
    }

    // Push data from client to server
    async pushData(req: Request, res: Response) {
        try {
            const { changes } = req.body;
            const userId = req.user.id;
            const companyId = req.user.companyId;

            const tenantDataSource = getTenantDataSource(companyId.toString());
            const result = await this.clientService.pushData(
                tenantDataSource,
                userId,
                changes
            );

            res.json({
                success: true,
                data: result,
                syncTimestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Push data error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to push data' 
            });
        }
    }

    // Get sync status
    async getSyncStatus(req: Request, res: Response) {
        try {
            const userId = req.user.id;
            const companyId = req.user.companyId;

            const tenantDataSource = getTenantDataSource(companyId.toString());
            const status = await this.clientService.getSyncStatus(
                tenantDataSource,
                userId
            );

            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            logger.error('Get sync status error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to get sync status' 
            });
        }
    }
} 