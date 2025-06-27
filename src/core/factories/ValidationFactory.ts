import { BaseValidation } from '../validations/BaseValidation';
import { IBaseValidation } from '../interfaces/IBaseValidation';

export class ValidationFactory {
  static create<T>(dtoClass: new () => T): IBaseValidation {
    throw new Error('Cannot instantiate abstract BaseValidation. Please provide a concrete validation implementation.');
  }
}