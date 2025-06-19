import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import logger from './logger';

// Load environment variables
config();

// Main database configuration
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false, // Disable synchronize for security
    logging: process.env.NODE_ENV === 'development',
    entities: ['src/models/**/*.ts'],
    migrations: ['src/migrations/**/*.ts'],
    migrationsRun: true, // Automatically run migrations on startup
    migrationsTableName: 'migrations_history',
    subscribers: ['src/subscribers/**/*.ts'],
});

// Function to create tenant database
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
        await tempDataSource.query(`CREATE DATABASE tenant_${tenantId}`);
        logger.info(`Created database for tenant: ${tenantId}`);
    } catch (error) {
        logger.error(`Error creating tenant database: ${error}`);
        throw error;
    } finally {
        await tempDataSource.destroy();
    }
};

// Function to get tenant database connection
export const getTenantDataSource = (tenantId: string): DataSource => {
    return new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: `tenant_${tenantId}`,
        synchronize: false, // Disable synchronize for security
        logging: process.env.NODE_ENV === 'development',
        entities: ['src/modules/**/*.ts'],
        migrations: ['src/migrations/**/*.ts'],
        migrationsRun: true,
        migrationsTableName: 'migrations_history',
    });
};

// Initialize main database connection
export const initializeMainDatabase = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        logger.info('Main database connection established');
    } catch (error) {
        logger.error('Error connecting to main database:', error);
        throw error;
    }
}; 