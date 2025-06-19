import { Config } from './config/Config';
import { Logger } from './logger/Logger';
import { DatabaseConfig } from './config/DatabaseConfig';
import { ApplicationFactory } from './factories/ApplicationFactory';
import { IModule } from './interfaces/IModule';

export class Bootstrap {
  private config: Config;
  private logger: Logger;

  constructor(private modules: IModule[]) {
    this.config = new Config();
    this.logger = new Logger(this.config);
  }

  async initialize(): Promise<void> {
    try {
      // Initialize database
      await DatabaseConfig.initialize(this.config, this.logger);

      // Create and start application
      const app = ApplicationFactory.create(this.modules);
      app.listen();

      this.logger.info('Application started successfully');
    } catch (error) {
      this.logger.error('Error starting application:', error);
      throw error;
    }
  }
} 