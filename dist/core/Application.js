"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const Config_1 = require("./config/Config");
const Logger_1 = require("./logger/Logger");
const ErrorHandlerMiddleware_1 = require("./middleware/ErrorHandlerMiddleware");
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.config = new Config_1.Config();
        this.logger = new Logger_1.Logger(this.config);
        this.setupMiddleware();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)(this.config.cors));
        // Request parsing
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // Logging
        if (this.config.isDevelopment()) {
            this.app.use((0, morgan_1.default)('dev'));
        }
    }
    setupErrorHandling() {
        const errorHandler = new ErrorHandlerMiddleware_1.ErrorHandlerMiddleware();
        this.app.use((err, req, res, next) => {
            // Pass error as last argument to match ErrorHandlerMiddleware signature
            errorHandler.handle(req, res, next, err);
        });
    }
    use(middleware) {
        this.app.use(middleware);
    }
    listen() {
        const port = this.config.port;
        this.app.listen(port, () => {
            this.logger.info(`Server is running on port ${port}`);
        });
    }
    getApp() {
        return this.app;
    }
}
exports.App = App;
