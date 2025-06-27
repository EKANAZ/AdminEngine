import { Module } from '../Module';
import { IModule } from '../interfaces/IModule';

export class ModuleFactory {
  static create(moduleClass: new () => Module): IModule {
    return new moduleClass();
  }
}