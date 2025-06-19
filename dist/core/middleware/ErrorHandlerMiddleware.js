"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandlerMiddleware = void 0;
const BaseError_1 = require("../errors/BaseError");
const BaseMiddleware_1 = require("./BaseMiddleware");
class ErrorHandlerMiddleware extends BaseMiddleware_1.BaseMiddleware {
    async handle(error, req, res, next) {
        if (error instanceof BaseError_1.BaseError) {
            this.sendError(res, error.statusCode, error.message);
            return;
        }
        // Log unexpected errors
        console.error('Unexpected error:', error);
        this.sendError(res, 500, 'Internal server error');
    }
}
exports.ErrorHandlerMiddleware = ErrorHandlerMiddleware;
