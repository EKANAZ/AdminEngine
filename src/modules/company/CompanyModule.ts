import { Router } from 'express';
import { IModule } from '../../core/interfaces/IModule';
import companyRoutes from '../../routes/company.routes';

export class CompanyModule implements IModule {
  public router: Router;

  constructor() {
    this.router = Router();
  }

  initialize(): void {
    this.router.use(companyRoutes);
  }
} 