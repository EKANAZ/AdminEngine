import { BaseController } from '../controllers/BaseController';
import { IBaseController } from '../interfaces/IBaseController';
import { IBaseService } from '../interfaces/IBaseService';

export class ControllerFactory {
  static create<T>(service: IBaseService<T>): IBaseController {
    return new BaseController<T>(service);
  }
} 