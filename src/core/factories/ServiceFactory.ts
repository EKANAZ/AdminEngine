import { BaseService } from '../services/BaseService';
import { IBaseService } from '../interfaces/IBaseService';
import { IBaseRepository } from '../interfaces/IBaseRepository';

export class ServiceFactory {
  static create<T>(repository: IBaseRepository<T>): IBaseService<T> {
    throw new Error('Cannot instantiate abstract BaseService. Please provide a concrete service implementation.');
  }
}