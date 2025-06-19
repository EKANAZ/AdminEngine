import { DeepPartial, FindOptionsWhere } from 'typeorm';

export interface IBaseService<T> {
  findOne(where: FindOptionsWhere<T>): Promise<T | null>;
  find(where: FindOptionsWhere<T>): Promise<T[]>;
  create(data: DeepPartial<T>): Promise<T>;
  update(id: string, data: DeepPartial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
} 