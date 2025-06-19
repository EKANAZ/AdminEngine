"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModule = void 0;
const express_1 = require("express");
class UserModule {
    constructor() {
        this.router = (0, express_1.Router)();
    }
    initialize() { }
}
exports.UserModule = UserModule;
