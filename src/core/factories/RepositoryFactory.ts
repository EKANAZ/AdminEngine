import { Repository, EntityTarget, getRepository, ObjectLiteral } from 'typeorm';
import { BaseRepository } from '../repositories/BaseRepository';
import { IBaseRepository } from '../interfaces/IBaseRepository';

export class RepositoryFactory {
  static create<T extends ObjectLiteral>(entity: EntityTarget<T>): IBaseRepository<T> {
    const repository = getRepository(entity);
    throw new Error('Cannot instantiate abstract BaseRepository. Please provide a concrete repository implementation.');
  }
}