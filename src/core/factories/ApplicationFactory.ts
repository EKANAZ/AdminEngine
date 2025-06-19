import { App } from '../Application';
import { IModule } from '../interfaces/IModule';

export class ApplicationFactory {
  static create(modules: IModule[]): App {
    const app = new App();
    
    modules.forEach(module => {
      module.initialize();
      app.use(module.router);
    });

    return app;
  }
} 