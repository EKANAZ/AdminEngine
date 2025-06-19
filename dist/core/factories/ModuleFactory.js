"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleFactory = void 0;
class ModuleFactory {
    static create(moduleClass) {
        return new moduleClass();
    }
}
exports.ModuleFactory = ModuleFactory;
