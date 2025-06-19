"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston_1 = __importDefault(require("winston"));
class Logger {
    constructor(config) {
        this.config = config;
        this.logger = winston_1.default.createLogger({
            level: config.logging.level,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
            transports: [
                new winston_1.default.transports.Console({
                    format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
                })
            ]
        });
    }
    info(message, ...args) {
        this.logger.info(message, ...args);
    }
    error(message, ...args) {
        this.logger.error(message, ...args);
    }
    warn(message, ...args) {
        this.logger.warn(message, ...args);
    }
    debug(message, ...args) {
        this.logger.debug(message, ...args);
    }
    trace(message, ...args) {
        this.logger.silly(message, ...args);
    }
}
exports.Logger = Logger;
