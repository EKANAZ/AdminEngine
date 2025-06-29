import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import jwt from 'jsonwebtoken';

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

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

  try {
    const secret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, secret) as any;
    
    // Set the full decoded JWT payload as user object
    (req as any).user = {
      id: decoded.sub,
      email: decoded.email,
      companyId: decoded.companyId,
      customerId: decoded.customerId, // For client users
      roles: decoded.roles || [],
      type: decoded.type || 'user'
    };
    
    console.log('JWT decoded user:', (req as any).user);
    console.log('JWT payload:', decoded);
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}; 