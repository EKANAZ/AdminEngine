"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseMiddleware = void 0;
class BaseMiddleware {
    sendError(res, status, message) {
        res.status(status).json({ message });
    }
    sendSuccess(res, data) {
        res.json(data);
    }
}
exports.BaseMiddleware = BaseMiddleware;
