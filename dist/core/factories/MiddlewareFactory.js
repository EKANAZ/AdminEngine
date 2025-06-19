"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareFactory = void 0;
const BaseMiddleware_1 = require("../middleware/BaseMiddleware");
class MiddlewareFactory {
    static create() {
        return new BaseMiddleware_1.BaseMiddleware();
    }
}
exports.MiddlewareFactory = MiddlewareFactory;
