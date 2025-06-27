"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const typeorm_1 = require("typeorm");
const SyncRegistry_1 = require("../core/sync/SyncRegistry");
const logger_1 = __importDefault(require("../config/logger"));
class SyncService {
    constructor(dataSource, conflictResolution = 'server-wins') {
        this.dataSource = dataSource;
        this.conflictResolution = conflictResolution;
    }
    // Universal push: accepts a flat array of changes
    async pushChanges(tenantId, changes) {
        const results = [];
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            for (const change of changes) {
                const repo = this.getRepository(change.entityType);
                const entityData = { ...change.data, tenantId };
                let entity = await repo.findOne({ where: { id: entityData.id, tenantId } });
                if (entity) {
                    // Conflict resolution
                    entity = this.resolveConflict(entity, entityData);
                    await repo.save(entity);
                }
                else {
                    entity = repo.create(entityData);
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
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            logger_1.default.error('Push data error:', error);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    // Universal pull: get all entities of given types updated after lastSync
    async pullData(tenantId, lastSync, entityTypes) {
        const result = {};
        for (const entityType of entityTypes) {
            const repo = this.getRepository(entityType);
            const data = await repo.find({
                where: { tenantId, updatedAt: (0, typeorm_1.MoreThan)(lastSync), isDeleted: false },
                order: { updatedAt: 'DESC' },
            });
            result[entityType] = data;
        }
        return {
            success: true,
            data: result,
            syncTimestamp: new Date().toISOString(),
        };
    }
    getRepository(entityType) {
        const entityClass = SyncRegistry_1.SyncRegistry.getEntityClass(entityType);
        return this.dataSource.getRepository(entityClass);
    }
    resolveConflict(server, client) {
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
}
exports.SyncService = SyncService;
// COMMENT: This refactored SyncService uses a registry-based universal syncing logic. It supports syncing any registered entity type, handles conflict resolution, and is ready for multi-tenant, multi-entity sync APIs. 
