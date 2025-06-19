import { Request, Response, NextFunction } from 'express';

export interface IBaseMiddleware {
  handle(req: Request, res: Response, next: NextFunction): Promise<void>;
} 