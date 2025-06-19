import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export interface AuthenticatedRequest extends Request {
  user?: any;
  company?: any;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const authService = new AuthService();
    const user = await authService.validateToken(token);

    req.user = user;
    req.company = user.company;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (requiredPermissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const userPermissions = req.user.roles.flatMap((role: any) =>
        role.permissions.map((permission: any) => `${permission.resource}:${permission.action}`)
      );

      const hasPermission = requiredPermissions.every(permission => {
        // Check for wildcard permissions
        if (userPermissions.includes('*:*')) return true;

        const [resource, action] = permission.split(':');
        return userPermissions.includes(`${resource}:${action}`);
      });

      if (!hasPermission) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};

export const requireCompany = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.company) {
      return res.status(401).json({ message: 'Company context required' });
    }

    if (req.company.status !== 'active') {
      return res.status(403).json({ message: 'Company account is inactive' });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: 'Error checking company status' });
  }
}; 