import { Bootstrap } from './core/Bootstrap';
import { AuthModule } from './modules/auth/AuthModule';
import { UserModule } from './modules/user/UserModule';
import { CompanyModule } from './modules/company/CompanyModule';
import { RoleModule } from './modules/role/RoleModule';
import { PermissionModule } from './modules/permission/PermissionModule';
import { AiModule } from './modules/ai/AiModule';
import { GoogleAuthModule } from './modules/auth/GoogleAuthModule';
import { OtpAuthModule } from './modules/auth/OtpAuthModule';
import { IModule } from './core/interfaces/IModule';
import { SyncModule } from './modules/sync/SyncModule';

async function bootstrap() {
  const modules: IModule[] = [
    new AuthModule(),
    new UserModule(),
    new CompanyModule(),
    new RoleModule(),
    new PermissionModule(),
    // new AiModule(),
    // new GoogleAuthModule(),
    // new OtpAuthModule(),
    new SyncModule()
  ];

  const app = new Bootstrap(modules);
  await app.initialize();
}

bootstrap().catch(console.error);