import { App } from '../Application';
import { IModule } from '../interfaces/IModule';
import { SyncModule } from '../../modules/sync/SyncModule';
import { AuthModule } from '../../modules/auth/AuthModule';
import { UserModule } from '../../modules/user/UserModule';
import { CompanyModule } from '../../modules/company/CompanyModule';
import { RoleModule } from '../../modules/role/RoleModule';
import { PermissionModule } from '../../modules/permission/PermissionModule';
import customerRoutes from '../../routes/customer.routes';

export class ApplicationFactory {
  static create(modules: IModule[]): App {
    const app = new App();
    
    modules.forEach(module => {
      module.initialize();
      app.use('/api/customers', customerRoutes);
      let path = '';
      if (module.constructor.name === 'AuthModule') path = '/api/auth';
      else if (module.constructor.name === 'UserModule') path = '/api/users';
      else if (module.constructor.name === 'CompanyModule') path = '/api/companies';
      else if (module.constructor.name === 'RoleModule') path = '/api/roles';
      else if (module.constructor.name === 'PermissionModule') path = '/api/permissions';
      else if (module.constructor.name === 'SyncModule') path = '/api/client/sync';
      else if (module.constructor.name === 'AiModule') path = '/api/ai';
      else if (module.constructor.name === 'GoogleAuthModule') path = '/api/auth/google';
      else if (module.constructor.name === 'OtpAuthModule') path = '/api/auth/otp';
      else path = '/api';
      app.use(path, module.router);
    });

    app.use((_req: any, _res: any) => {
      _res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    });

    return app;
  }
}