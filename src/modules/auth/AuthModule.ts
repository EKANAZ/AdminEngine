import { Router } from 'express';
import authRoutes from '../../routes/auth.routes';
import { IModule } from '../../core/interfaces/IModule';

export class AuthModule implements IModule {
  public router: Router;

  constructor() {
    this.router = Router();
  }

  initialize(): void {
    // Mount authentication routes at root (prefix handled by ApplicationFactory)
    this.router.use(authRoutes);
  }
} 