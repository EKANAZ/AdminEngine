import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { ApiResponse } from '../types';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error(`[${err.statusCode}] ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    } as ApiResponse);
  }

  // Handle TypeORM errors
  if (err.name === 'QueryFailedError') {
    logger.error(`Database error: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: 'Database operation failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    } as ApiResponse);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.error(`JWT error: ${err.message}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    } as ApiResponse);
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    logger.error(`Validation error: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    } as ApiResponse);
  }

  // Handle unknown errors
  logger.error(`Unhandled error: ${err.message}`);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  } as ApiResponse);
}; 