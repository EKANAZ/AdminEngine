"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConfig = void 0;
const typeorm_1 = require("typeorm");
class DatabaseConfig {
    static async initialize(config, logger) {
        try {
            this.dataSource = new typeorm_1.DataSource({
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
        }
        catch (error) {
            logger.error('Error connecting to database:', error);
            throw error;
        }
    }
    static getDataSource() {
        if (!this.dataSource) {
            throw new Error('Database not initialized');
        }
        return this.dataSource;
    }
}
exports.DatabaseConfig = DatabaseConfig;
