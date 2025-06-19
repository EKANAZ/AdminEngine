import { BaseValidation } from '../validations/BaseValidation';
import { IBaseValidation } from '../interfaces/IBaseValidation';

export class ValidationFactory {
  static create<T>(dtoClass: new () => T): IBaseValidation {
    return new BaseValidation<T>(dtoClass);
  }
} 