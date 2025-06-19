"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bootstrap = void 0;
const Config_1 = require("./config/Config");
const Logger_1 = require("./logger/Logger");
const DatabaseConfig_1 = require("./config/DatabaseConfig");
const ApplicationFactory_1 = require("./factories/ApplicationFactory");
class Bootstrap {
    constructor(modules) {
        this.modules = modules;
        this.config = new Config_1.Config();
        this.logger = new Logger_1.Logger(this.config);
    }
    async initialize() {
        try {
            // Initialize database
            await DatabaseConfig_1.DatabaseConfig.initialize(this.config, this.logger);
            // Create and start application
            const app = ApplicationFactory_1.ApplicationFactory.create(this.modules);
            app.listen();
            this.logger.info('Application started successfully');
        }
        catch (error) {
            this.logger.error('Error starting application:', error);
            throw error;
        }
    }
}
exports.Bootstrap = Bootstrap;
