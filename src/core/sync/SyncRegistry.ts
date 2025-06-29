// src/core/sync/SyncRegistry.ts

import { ClientUser } from '../../models/ClientUser';
import { Interaction } from '../../models/Interaction';

export class SyncRegistry {
  private static entityMap: Record<string, any> = {
    end_user: ClientUser,
    interactions: Interaction,
  };

  static getEntityClass(entityType: string) {
    const entityClass = this.entityMap[entityType];
    if (!entityClass) throw new Error(`Entity type ${entityType} not registered`);
    return entityClass;
  }
}

// COMMENT: This registry allows dynamic resolution of entity classes for syncing, enabling universal sync logic. 