"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareFactory = void 0;
class MiddlewareFactory {
    static create() {
        throw new Error('Cannot instantiate abstract BaseMiddleware. Please provide a concrete middleware implementation.');
    }
}
exports.MiddlewareFactory = MiddlewareFactory;
