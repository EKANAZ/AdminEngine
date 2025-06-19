import { DeepPartial, FindOptionsWhere } from 'typeorm';
import { IBaseService } from '../interfaces/IBaseService';
import { IBaseRepository } from '../interfaces/IBaseRepository';

export abstract class BaseService<T> implements IBaseService<T> {
  constructor(protected readonly repository: IBaseRepository<T>) {}

  async findOne(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne(where);
  }

  async find(where: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.find(where);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
} 