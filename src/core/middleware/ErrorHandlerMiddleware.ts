import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../errors/BaseError';
import { BaseMiddleware } from './BaseMiddleware';

export class ErrorHandlerMiddleware extends BaseMiddleware {
  async handle(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (error instanceof BaseError) {
      this.sendError(res, error.statusCode, error.message);
      return;
    }

    // Log unexpected errors
    console.error('Unexpected error:', error);

    this.sendError(res, 500, 'Internal server error');
  }
} 