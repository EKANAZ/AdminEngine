"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMainDatabase = exports.getTenantDataSource = exports.createTenantDatabase = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const logger_1 = __importDefault(require("./logger"));
// Load environment variables
(0, dotenv_1.config)();
// Main database configuration
exports.AppDataSource = new typeorm_1.DataSource({
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
const createTenantDatabase = async (tenantId) => {
    const tempDataSource = new typeorm_1.DataSource({
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
        logger_1.default.info(`Created database for tenant: ${tenantId}`);
    }
    catch (error) {
        logger_1.default.error(`Error creating tenant database: ${error}`);
        throw error;
    }
    finally {
        await tempDataSource.destroy();
    }
};
exports.createTenantDatabase = createTenantDatabase;
// Function to get tenant database connection
const getTenantDataSource = (tenantId) => {
    return new typeorm_1.DataSource({
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
exports.getTenantDataSource = getTenantDataSource;
// Initialize main database connection
const initializeMainDatabase = async () => {
    try {
        await exports.AppDataSource.initialize();
        logger_1.default.info('Main database connection established');
    }
    catch (error) {
        logger_1.default.error('Error connecting to main database:', error);
        throw error;
    }
};
exports.initializeMainDatabase = initializeMainDatabase;
