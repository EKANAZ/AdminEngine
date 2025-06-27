import { Router } from 'express';
import { IModule } from '../../core/interfaces/IModule';
import userRoutes from '../../routes/user.routes';

export class UserModule implements IModule {
  public router: Router = Router();
  initialize(): void {
    this.router.use(userRoutes);
  }
} 