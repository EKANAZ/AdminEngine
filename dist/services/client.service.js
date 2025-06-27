"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientService = void 0;
const typeorm_1 = require("typeorm");
const ClientUser_1 = require("../models/ClientUser");
const Company_1 = require("../models/Company");
const jsonwebtoken_1 = require("jsonwebtoken");
const bcrypt_1 = require("bcrypt");
const logger_1 = __importDefault(require("../config/logger"));
const DatabaseConfig_1 = require("../core/config/DatabaseConfig");
class ClientService {
    // Client login
    async login(email, password, companyDomain) {
        try {
            // Find company by domain
            const company = await DatabaseConfig_1.DatabaseConfig.getDataSource().getRepository(Company_1.Company).findOne({ where: { domain: companyDomain } });
            if (!company) {
                throw new Error('Company not found');
            }
            // Get tenant database connection
            const tenantDataSource = new typeorm_1.DataSource({
                type: 'postgres',
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || '5432'),
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: `tenant_${company.id}`,
                entities: [ClientUser_1.ClientUser],
            });
            await tenantDataSource.initialize();
            // Find user in tenant database
            const user = await tenantDataSource
                .getRepository(ClientUser_1.ClientUser)
                .findOne({ where: { email } });
            if (!user || !(await (0, bcrypt_1.compare)(password, user.password))) {
                throw new Error('Invalid credentials');
            }
            // Generate JWT token
            const token = (0, jsonwebtoken_1.sign)({
                userId: user.id,
                companyId: company.id,
                email: user.email
            }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
            await tenantDataSource.destroy();
            return {
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName
                    }
                }
            };
        }
        catch (error) {
            logger_1.default.error('Client login error:', error);
            throw error;
        }
    }
    // Pull data from server to client
    async pullData(dataSource, userId, lastSyncTimestamp, entityTypes) {
        try {
            const result = {};
            for (const entityType of entityTypes) {
                const repository = dataSource.getRepository(entityType);
                const data = await repository.find({
                    where: {
                        updatedAt: (0, typeorm_1.MoreThan)(new Date(lastSyncTimestamp))
                    }
                });
                result[entityType] = data;
            }
            return result;
        }
        catch (error) {
            logger_1.default.error('Pull data error:', error);
            throw error;
        }
    }
    // Push data from client to server
    async pushData(dataSource, userId, changes) {
        try {
            const result = {};
            for (const [entityType, entities] of Object.entries(changes)) {
                const repository = dataSource.getRepository(entityType);
                for (const entity of entities) {
                    if (entity.id) {
                        // Update existing entity
                        await repository.update(entity.id, entity);
                    }
                    else {
                        // Create new entity
                        await repository.save(entity);
                    }
                }
                result[entityType] = await repository.find();
            }
            return result;
        }
        catch (error) {
            logger_1.default.error('Push data error:', error);
            throw error;
        }
    }
    // Get sync status
    async getSyncStatus(dataSource, userId) {
        try {
            const syncStatus = await dataSource
                .getRepository('SyncStatus')
                .findOne({ where: { userId } });
            return {
                lastSyncTimestamp: syncStatus?.lastSyncTimestamp || null,
                pendingChanges: syncStatus?.pendingChanges || 0
            };
        }
        catch (error) {
            logger_1.default.error('Get sync status error:', error);
            throw error;
        }
    }
    get companyRepository() { return DatabaseConfig_1.DatabaseConfig.getDataSource().getRepository(Company_1.Company); }
}
exports.ClientService = ClientService;
