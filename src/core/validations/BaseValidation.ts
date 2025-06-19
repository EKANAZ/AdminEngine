import { Request, Response, NextFunction } from 'express';
import { IBaseValidation } from '../interfaces/IBaseValidation';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export abstract class BaseValidation<T> implements IBaseValidation {
  constructor(protected readonly dtoClass: new () => T) {}

  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const dtoObject = plainToClass(this.dtoClass, req.body);
    const errors = await validate(dtoObject);

    if (errors.length > 0) {
      const validationErrors = errors.map(error => ({
        property: error.property,
        constraints: error.constraints
      }));
      res.status(400).json({ errors: validationErrors });
      return;
    }

    req.body = dtoObject;
    next();
  }
} 