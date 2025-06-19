import { BaseService } from '../services/BaseService';
import { IBaseService } from '../interfaces/IBaseService';
import { IBaseRepository } from '../interfaces/IBaseRepository';

export class ServiceFactory {
  static create<T>(repository: IBaseRepository<T>): IBaseService<T> {
    return new BaseService<T>(repository);
  }
} 