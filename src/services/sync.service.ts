import { DataSource, QueryRunner, Repository, MoreThan } from 'typeorm';
import { SyncRegistry } from '../core/sync/SyncRegistry';
import logger from '../config/logger';

export interface SyncChange {
  entityType: string;
  data: any;
}

export class SyncService {
  private dataSource: DataSource;
  private conflictResolution: 'server-wins' | 'client-wins' | 'last-write-wins' | 'merge';

  constructor(
    dataSource: DataSource,
    conflictResolution: 'server-wins' | 'client-wins' | 'last-write-wins' | 'merge' = 'server-wins'
  ) {
    this.dataSource = dataSource;
    this.conflictResolution = conflictResolution;
  }

  // Universal push: accepts a flat array of changes
  async pushChanges(tenantId: string, changes: SyncChange[]): Promise<any> {
    const results: any[] = [];
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
        } else {
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
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('Push data error:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Universal pull: get all entities of given types updated after lastSync
  async pullData(tenantId: string, lastSync: Date, entityTypes: string[]): Promise<any> {
    const result: any = {};
    for (const entityType of entityTypes) {
      const repo = this.getRepository(entityType);
      const data = await repo.find({
        where: { tenantId, updatedAt: MoreThan(lastSync), isDeleted: false },
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
}

// COMMENT: This refactored SyncService uses a registry-based universal syncing logic. It supports syncing any registered entity type, handles conflict resolution, and is ready for multi-tenant, multi-entity sync APIs. 