"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Module = void 0;
const express_1 = require("express");
// Basic Module class for use in factories
class Module {
    // Add properties and methods as needed for your module system
    constructor() {
        this.router = (0, express_1.Router)();
    }
    initialize() {
        // Default implementation, override in subclasses
    }
}
exports.Module = Module;
