"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientController = void 0;
const client_service_1 = require("../services/client.service");
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../config/logger"));
class ClientController {
    constructor() {
        this.clientService = new client_service_1.ClientService();
    }
    // Client login
    async login(req, res) {
        try {
            const { email, password, companyDomain } = req.body;
            const result = await this.clientService.login(email, password, companyDomain);
            res.json(result);
        }
        catch (error) {
            logger_1.default.error('Client login error:', error);
            res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
    }
    // Pull data from server to client
    async pullData(req, res) {
        try {
            const { lastSyncTimestamp, entityTypes } = req.body;
            const userId = req.user?.id;
            const companyId = req.user?.companyId;
            if (!userId || !companyId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const tenantDataSource = (0, database_1.getTenantDataSource)(companyId.toString());
            const result = await this.clientService.pullData(tenantDataSource, userId, lastSyncTimestamp, entityTypes);
            res.json({
                success: true,
                data: result,
                syncTimestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.default.error('Pull data error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to pull data'
            });
        }
    }
    // Push data from client to server
    async pushData(req, res) {
        try {
            const { changes } = req.body;
            const userId = req.user?.id;
            const companyId = req.user?.companyId;
            if (!userId || !companyId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const tenantDataSource = (0, database_1.getTenantDataSource)(companyId.toString());
            const result = await this.clientService.pushData(tenantDataSource, userId, changes);
            res.json({
                success: true,
                data: result,
                syncTimestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.default.error('Push data error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to push data'
            });
        }
    }
    // Get sync status
    async getSyncStatus(req, res) {
        try {
            const userId = req.user?.id;
            const companyId = req.user?.companyId;
            if (!userId || !companyId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const tenantDataSource = (0, database_1.getTenantDataSource)(companyId.toString());
            const status = await this.clientService.getSyncStatus(tenantDataSource, userId);
            res.json({
                success: true,
                data: status
            });
        }
        catch (error) {
            logger_1.default.error('Get sync status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get sync status'
            });
        }
    }
}
exports.ClientController = ClientController;
