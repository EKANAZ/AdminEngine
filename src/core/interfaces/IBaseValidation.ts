import { Request, Response, NextFunction } from 'express';

export interface IBaseValidation {
  validate(req: Request, res: Response, next: NextFunction): Promise<void>;
} 