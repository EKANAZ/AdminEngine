import { Repository, EntityTarget, getRepository } from 'typeorm';
import { BaseRepository } from '../repositories/BaseRepository';
import { IBaseRepository } from '../interfaces/IBaseRepository';

export class RepositoryFactory {
  static create<T>(entity: EntityTarget<T>): IBaseRepository<T> {
    const repository = getRepository(entity);
    return new BaseRepository<T>(repository);
  }
} 