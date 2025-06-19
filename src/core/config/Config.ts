import { IConfig } from '../interfaces/IConfig';
import dotenv from 'dotenv';

dotenv.config();

export class Config implements IConfig {
  public readonly port: number;
  public readonly nodeEnv: string;
  public readonly database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  public readonly jwt: {
    secret: string;
    expiresIn: string;
  };
  public readonly cors: {
    origin: string[];
    methods: string[];
    allowedHeaders: string[];
  };
  public readonly logging: {
    level: string;
    format: string;
  };

  constructor() {
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.nodeEnv = process.env.NODE_ENV || 'development';
    
    this.database = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'saas_platform'
    };

    this.jwt = {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    };

    this.cors = {
      origin: (process.env.CORS_ORIGIN || '*').split(','),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };

    this.logging = {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json'
    };
  }

  public isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  public isTest(): boolean {
    return this.nodeEnv === 'test';
  }
} 