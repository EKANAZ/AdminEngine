import { Router } from 'express';
import { IModule } from '../../core/interfaces/IModule';
import roleRoutes from '../../routes/role.routes';

export class RoleModule implements IModule {
  public router: Router;
  constructor() {
    this.router = Router();
  }
  initialize(): void {
    this.router.use(roleRoutes);
  }
}