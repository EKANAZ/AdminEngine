import { Router } from 'express';
import { IModule } from '../../core/interfaces/IModule';

export class UserModule implements IModule {
  public router: Router = Router();
  initialize(): void {}
} 