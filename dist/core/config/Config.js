"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class Config {
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
    isDevelopment() {
        return this.nodeEnv === 'development';
    }
    isProduction() {
        return this.nodeEnv === 'production';
    }
    isTest() {
        return this.nodeEnv === 'test';
    }
}
exports.Config = Config;
