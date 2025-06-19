"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../../routes/auth.routes"));
class AuthModule {
    constructor() {
        this.router = (0, express_1.Router)();
    }
    initialize() {
        // Mount authentication routes under /api/auth
        this.router.use('/api/auth', auth_routes_1.default);
    }
}
exports.AuthModule = AuthModule;
