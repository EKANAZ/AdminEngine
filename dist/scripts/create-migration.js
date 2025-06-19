"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../config/logger"));
// Load environment variables
(0, dotenv_1.config)();
async function createMigration() {
    try {
        // Initialize the data source
        await database_1.AppDataSource.initialize();
        logger_1.default.info('Database connection established');
        // Create a new migration
        const timestamp = new Date().getTime();
        const migrationName = process.argv[2] || `migration_${timestamp}`;
        // Generate migration
        await database_1.AppDataSource.runMigrations();
        logger_1.default.info(`Migration ${migrationName} created successfully`);
    }
    catch (error) {
        logger_1.default.error('Error creating migration:', error);
        process.exit(1);
    }
    finally {
        await database_1.AppDataSource.destroy();
    }
}
createMigration();
