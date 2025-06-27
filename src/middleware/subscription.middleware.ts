import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
// import { CompanyService } from '../services/company.service';

export async function checkSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Assume req.user.companyId is set
  const companyId = req.user?.id; // Use user ID instead of companyId for now
  // TODO: Fetch subscription from DB using CompanyService
  // const subscription = await CompanyService.getSubscription(companyId);
  // For now, mock:
  const subscription = { status: 'active', endDate: new Date(Date.now() + 1000000) };
  if (!subscription || subscription.status !== 'active' || new Date() > new Date(subscription.endDate)) {
    return res.status(403).json({ message: 'Subscription expired or inactive.' });
  }
  next();
} 