import { Request } from 'express';
import { Company } from '../models/Company';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; roles: string[] } | undefined;
  company?: Company;
}

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  roles: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
} 