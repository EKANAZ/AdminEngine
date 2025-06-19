import { DataSource } from 'typeorm';
import { Config } from './Config';
import { Logger } from '../logger/Logger';

export class DatabaseConfig {
  private static dataSource: DataSource;

  static async initialize(config: Config, logger: Logger): Promise<void> {
    try {
      this.dataSource = new DataSource({
        type: 'postgres',
        host: config.database.host,
        port: config.database.port,
        username: config.database.username,
        password: config.database.password,
        database: config.database.database,
        entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
        synchronize: config.isDevelopment(),
        logging: config.isDevelopment(),
      });

      await this.dataSource.initialize();
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Error connecting to database:', error);
      throw error;
    }
  }

  static getDataSource(): DataSource {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }
    return this.dataSource;
  }
} 