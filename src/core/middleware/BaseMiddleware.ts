import { Request, Response, NextFunction } from 'express';
import { IBaseMiddleware } from '../interfaces/IBaseMiddleware';

export abstract class BaseMiddleware implements IBaseMiddleware {
  abstract handle(req: Request, res: Response, next: NextFunction): Promise<void>;

  protected sendError(res: Response, status: number, message: string): void {
    res.status(status).json({ message });
  }

  protected sendSuccess(res: Response, data: any): void {
    res.json(data);
  }
} 