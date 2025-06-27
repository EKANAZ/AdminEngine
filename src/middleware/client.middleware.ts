import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { getTenantDataSource } from '../config/database';
import logger from '../config/logger';

export interface ClientRequest extends Request {
  client?: {
    id: string;
    email: string;
    type: 'client';
  };
  clientDataSource?: any;
}

export const authenticateClient = async (req: ClientRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Client token required'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    if (decoded.type !== 'client') {
      res.status(403).json({
        success: false,
        error: 'Invalid client token'
      });
      return;
    }

    // Attach client info to request
    req.client = {
      id: decoded.customerId,
      email: decoded.email,
      type: 'client'
    };

    // Get client's database connection
    const clientDataSource = getTenantDataSource(decoded.customerId);
    req.clientDataSource = clientDataSource;

    next();
  } catch (error) {
    logger.error('Client authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid client token'
    });
  }
};

export const authorizeClient = (permissions: string[] = []) => {
  return (req: ClientRequest, res: Response, next: NextFunction): void => {
    // For now, all authenticated clients have full access to their database
    // You can implement permission checking here later
    next();
  };
}; 