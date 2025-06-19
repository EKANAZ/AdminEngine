import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Config } from './config/Config';
import { Logger } from './logger/Logger';
import { ErrorHandlerMiddleware } from './middleware/ErrorHandlerMiddleware';

export class App {
  private app: Application;
  private config: Config;
  private logger: Logger;

  constructor() {
    this.app = express();
    this.config = new Config();
    this.logger = new Logger(this.config);
    this.setupMiddleware();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors(this.config.cors));

    // Request parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    if (this.config.isDevelopment()) {
      this.app.use(morgan('dev'));
    }
  }

  private setupErrorHandling(): void {
    const errorHandler = new ErrorHandlerMiddleware();
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      errorHandler.handle(err, req, res, next);
    });
  }

  public use(middleware: any): void {
    this.app.use(middleware);
  }

  public listen(): void {
    const port = this.config.port;
    this.app.listen(port, () => {
      this.logger.info(`Server is running on port ${port}`);
    });
  }

  public getApp(): Application {
    return this.app;
  }
} 