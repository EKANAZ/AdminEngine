import { Bootstrap } from './core/Bootstrap';
import { AuthModule } from './modules/auth/AuthModule';
import { UserModule } from './modules/user/UserModule';
import { CompanyModule } from './modules/company/CompanyModule';
import { RoleModule } from './modules/role/RoleModule';
import { PermissionModule } from './modules/permission/PermissionModule';

async function bootstrap() {
  const modules = [
    new AuthModule(),
    new UserModule(),
    new CompanyModule(),
    new RoleModule(),
    new PermissionModule()
  ];

  const app = new Bootstrap(modules);
  await app.initialize();
}

bootstrap().catch(console.error); 