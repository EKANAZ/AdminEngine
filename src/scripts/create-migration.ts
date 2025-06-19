import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { AppDataSource } from '../config/database';
import logger from '../config/logger';

// Load environment variables
config();

async function createMigration() {
    try {
        // Initialize the data source
        await AppDataSource.initialize();
        logger.info('Database connection established');

        // Create a new migration
        const timestamp = new Date().getTime();
        const migrationName = process.argv[2] || `migration_${timestamp}`;
        
        // Generate migration
        await AppDataSource.runMigrations();
        logger.info(`Migration ${migrationName} created successfully`);

    } catch (error) {
        logger.error('Error creating migration:', error);
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
}

createMigration(); 