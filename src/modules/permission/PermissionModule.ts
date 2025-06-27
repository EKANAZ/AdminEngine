import { Router } from 'express';
import { IModule } from '../../core/interfaces/IModule';
import permissionRoutes from '../../routes/permission.routes';

export class PermissionModule implements IModule {
  public router: Router;
  constructor() {
    this.router = Router();
  }
  initialize(): void {
    this.router.use(permissionRoutes);
  }
}