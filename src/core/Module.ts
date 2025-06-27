import { Router } from 'express';
import { IModule } from './interfaces/IModule';

// Basic Module class for use in factories
export class Module implements IModule {
  public router: Router;
  // Add properties and methods as needed for your module system
  constructor() {
    this.router = Router();
  }
  initialize(): void {
    // Default implementation, override in subclasses
  }
}
