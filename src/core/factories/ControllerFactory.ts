import { IBaseController } from '../interfaces/IBaseController';
import { IBaseService } from '../interfaces/IBaseService';

export class ControllerFactory {
  static create<T>(ControllerClass: new (service: IBaseService<T>) => IBaseController, service: IBaseService<T>): IBaseController {
    return new ControllerClass(service);
  }
} 