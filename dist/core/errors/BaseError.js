"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = exports.BaseError = void 0;
class BaseError extends Error {
    constructor(statusCode, message, errors) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.BaseError = BaseError;
class NotFoundError extends BaseError {
    constructor(message = 'Resource not found') {
        super(404, message);
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends BaseError {
    constructor(message = 'Validation failed', errors) {
        super(400, message, errors);
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends BaseError {
    constructor(message = 'Unauthorized') {
        super(401, message);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends BaseError {
    constructor(message = 'Forbidden') {
        super(403, message);
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends BaseError {
    constructor(message = 'Resource conflict') {
        super(409, message);
    }
}
exports.ConflictError = ConflictError;
