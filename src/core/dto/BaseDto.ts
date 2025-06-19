import { validate } from 'class-validator';
import { IDto } from '../interfaces/IDto';
import { ValidationError } from '../errors/BaseError';

export abstract class BaseDto implements IDto {
  async validate(): Promise<void> {
    const errors = await validate(this);
    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }
} 