import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import logger from './logger';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { Module } from '../models/Module';
import { CompanyModule } from '../models/CompanyModule';
import { Subscription } from '../models/Subscription';
import { Customer } from '../models/Customer';

// Load environment variables
config();

// Main database configuration (for your company only)
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false, // Disable synchronize for security
    logging: process.env.NODE_ENV === 'development',
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
    migrations: ['src/migrations/**/*.ts'],
    migrationsRun: true, // Automatically run migrations on startup
    migrationsTableName: 'migrations_history',
    subscribers: ['src/subscribers/**/*.ts'],
});

// Function to create tenant database (for client users only)
export const createTenantDatabase = async (tenantId: string): Promise<void> => {
    const tempDataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: 'postgres', // Connect to default database
    });

    try {
        await tempDataSource.initialize();
        const dbName = `tenant_${tenantId.replace(/-/g, '')}`;
        await tempDataSource.query(`CREATE DATABASE "${dbName}"`);
        logger.info(`Created database for tenant: ${dbName}`);

        // Import tenant entities only here
        const { users_client } = require('../modules/crm/entities/Customer_user');
        const { Interaction } = require('../modules/crm/entities/Interaction');

        // ONLY tenant entities, synchronize, and logging
        const newTenantDataSource = new DataSource({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: dbName,
          entities: [users_client, Interaction], // ONLY tenant entities!
          synchronize: true,
          logging: process.env.NODE_ENV === 'development'
        });
        await newTenantDataSource.initialize();
        logger.info(`Connected to new tenant DB: ${dbName}`);
        await newTenantDataSource.synchronize();
        logger.info(`Synchronized schema in tenant DB: ${dbName}`);
        await newTenantDataSource.destroy();
        await tempDataSource.destroy();
    } catch (error) {
        logger.error(`Error creating tenant database: ${error}`);
        throw error;
    }
};

// Function to get tenant database connection (for client users only)
export const getTenantDataSource = (tenantId: string): DataSource => {
    // Import tenant entities only here
    const { users_client } = require('../modules/crm/entities/Customer_user');
    const { Interaction } = require('../modules/crm/entities/Interaction');
    return new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: `tenant_${tenantId.replace(/-/g, '')}`,
        synchronize: true,
        logging: process.env.NODE_ENV === 'development',
        entities: [
          users_client,   // Client staff/employees
          Interaction    // Interactions for client users
        ] // ONLY tenant entities!
    });
};

// Initialize main database connection
export const initializeMainDatabase = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        logger.info('Main database connection established');
        // List all tables in the main DB after connection
        const tables = await AppDataSource.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`);
        console.log('Main DB tables:', tables.map((t: any) => t.table_name));
    } catch (error) {
        logger.error('Error connecting to main database:', error);
        throw error;
    }
};