import { BaseMiddleware } from '../middleware/BaseMiddleware';
import { IBaseMiddleware } from '../interfaces/IBaseMiddleware';

export class MiddlewareFactory {
  static create(): IBaseMiddleware {
    return new BaseMiddleware();
  }
} 