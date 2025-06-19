"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const logger_1 = __importDefault(require("../config/logger"));
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        logger_1.default.error(`[${err.statusCode}] ${err.message}`);
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
    // Handle TypeORM errors
    if (err.name === 'QueryFailedError') {
        logger_1.default.error(`Database error: ${err.message}`);
        return res.status(400).json({
            success: false,
            message: 'Database operation failed',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        logger_1.default.error(`JWT error: ${err.message}`);
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
    // Handle validation errors
    if (err.name === 'ValidationError') {
        logger_1.default.error(`Validation error: ${err.message}`);
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
    // Handle unknown errors
    logger_1.default.error(`Unhandled error: ${err.message}`);
    return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
exports.errorHandler = errorHandler;
