// src/core/sync/SyncRegistry.ts

type EntityConstructor = { new (): any; name: string };

export class SyncRegistry {
  private static entityMap = new Map<string, EntityConstructor>();

  static register(entityClass: EntityConstructor) {
    this.entityMap.set(entityClass.name, entityClass);
  }

  static getEntityClass(entityType: string): EntityConstructor {
    const entityClass = this.entityMap.get(entityType);
    if (!entityClass) {
      throw new Error(`Entity type ${entityType} not registered`);
    }
    return entityClass;
  }
}

// COMMENT: This registry allows dynamic resolution of entity classes for syncing, enabling universal sync logic. 