import { DataSource } from 'typeorm';
import { Config } from './Config';
import { Logger } from '../logger/Logger';
import { User } from '../../models/User';
import { Role } from '../../models/Role';
import { Permission } from '../../models/Permission';
import { Company } from '../../models/Company';
import { Subscription } from '../../models/Subscription';
import { Module } from '../../models/Module';
import { CompanyModule } from '../../models/CompanyModule';
import { Customer } from '../../models/Customer';

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
        entities: [
          User,
          Role,
          Permission,
          Company,
          Subscription,
          Module,
          CompanyModule,
          Customer
        ],
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