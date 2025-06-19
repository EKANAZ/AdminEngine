import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { IBaseRepository } from '../interfaces/IBaseRepository';

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async findOne(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where });
  }

  async find(where: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.find({ where });
  }

  create(data: DeepPartial<T>): T {
    return this.repository.create(data);
  }

  async save(entity: T): Promise<T> {
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    await this.repository.update(id, data as any);
    return this.findOne({ id } as FindOptionsWhere<T>) as Promise<T>;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
} 