import { BaseMiddleware } from '../middleware/BaseMiddleware';
import { IBaseMiddleware } from '../interfaces/IBaseMiddleware';

export class MiddlewareFactory {
  static create(): IBaseMiddleware {
    throw new Error('Cannot instantiate abstract BaseMiddleware. Please provide a concrete middleware implementation.');
  }
}