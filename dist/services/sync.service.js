"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const logger_1 = __importDefault(require("../config/logger"));
class SyncService {
    constructor(dataSource, schema, conflictResolution = 'server-wins') {
        this.dataSource = dataSource;
        this.schema = schema;
        this.conflictResolution = conflictResolution;
    }
    // Pull data from server to client
    async pullData(lastSync, entityTypes) {
        try {
            const result = {};
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                for (const entityType of entityTypes) {
                    const repository = queryRunner.manager.getRepository(entityType);
                    const data = await repository.find({
                        where: {
                            updatedAt: MoreThan(lastSync)
                        }
                    });
                    // Transform and resolve conflicts
                    result[entityType] = await this.resolveConflicts(this.transformData(data, entityType), entityType);
                }
                await queryRunner.commitTransaction();
                return {
                    success: true,
                    data: result,
                    syncTimestamp: new Date().toISOString()
                };
            }
            catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            }
            finally {
                await queryRunner.release();
            }
        }
        catch (error) {
            logger_1.default.error('Pull data error:', error);
            throw error;
        }
    }
    // Push data from client to server
    async pushData(changes) {
        try {
            const result = {};
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                for (const [entityType, entities] of Object.entries(changes)) {
                    const repository = queryRunner.manager.getRepository(entityType);
                    for (const entity of entities) {
                        // Validate data against schema
                        this.validateData(entity, entityType);
                        // Check for conflicts
                        const existingEntity = await repository.findOne({
                            where: { id: entity.id }
                        });
                        if (existingEntity) {
                            // Resolve conflict
                            const resolvedEntity = await this.resolveConflict(existingEntity, entity, entityType);
                            await repository.update(entity.id, resolvedEntity);
                        }
                        else {
                            // Create new entity
                            await repository.save(entity);
                        }
                    }
                    result[entityType] = await repository.find();
                }
                await queryRunner.commitTransaction();
                return {
                    success: true,
                    data: result,
                    syncTimestamp: new Date().toISOString()
                };
            }
            catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            }
            finally {
                await queryRunner.release();
            }
        }
        catch (error) {
            logger_1.default.error('Push data error:', error);
            throw error;
        }
    }
    // Get sync status with offline queue
    async getSyncStatus() {
        try {
            const [syncStatus, offlineQueue] = await Promise.all([
                this.dataSource
                    .getRepository('SyncStatus')
                    .findOne(),
                this.dataSource
                    .getRepository('OfflineQueue')
                    .find()
            ]);
            return {
                success: true,
                data: {
                    lastSyncTimestamp: syncStatus?.lastSyncTimestamp || null,
                    pendingChanges: syncStatus?.pendingChanges || 0,
                    offlineQueueSize: offlineQueue.length,
                    isOnline: await this.checkConnectivity()
                }
            };
        }
        catch (error) {
            logger_1.default.error('Get sync status error:', error);
            throw error;
        }
    }
    // Resolve conflicts between server and client data
    async resolveConflict(serverEntity, clientEntity, entityType) {
        switch (this.conflictResolution) {
            case 'server-wins':
                return serverEntity;
            case 'client-wins':
                return clientEntity;
            case 'last-write-wins':
                return serverEntity.updatedAt > clientEntity.updatedAt
                    ? serverEntity
                    : clientEntity;
            case 'merge':
                return this.mergeEntities(serverEntity, clientEntity, entityType);
            default:
                throw new Error(`Unknown conflict resolution strategy: ${this.conflictResolution}`);
        }
    }
    // Merge entities based on schema
    mergeEntities(serverEntity, clientEntity, entityType) {
        const entitySchema = this.schema.entities[entityType];
        const merged = {};
        for (const field of entitySchema.fields) {
            if (field === 'updatedAt') {
                merged[field] = new Date();
            }
            else if (field === 'version') {
                merged[field] = Math.max(serverEntity[field] || 0, clientEntity[field] || 0) + 1;
            }
            else {
                merged[field] = clientEntity[field] || serverEntity[field];
            }
        }
        return merged;
    }
    // Check network connectivity
    async checkConnectivity() {
        try {
            // Implement your connectivity check here
            // For example, ping your server or check network status
            return true;
        }
        catch (error) {
            return false;
        }
    }
    // Transform data according to schema
    transformData(data, entityType) {
        const entitySchema = this.schema.entities[entityType];
        if (!entitySchema) {
            throw new Error(`Schema not found for entity type: ${entityType}`);
        }
        return data.map(item => {
            const transformed = {};
            for (const field of entitySchema.fields) {
                transformed[field] = item[field];
            }
            return transformed;
        });
    }
    // Validate data against schema
    validateData(data, entityType) {
        const entitySchema = this.schema.entities[entityType];
        if (!entitySchema) {
            throw new Error(`Schema not found for entity type: ${entityType}`);
        }
        for (const field of entitySchema.fields) {
            if (!(field in data)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }
}
exports.SyncService = SyncService;
