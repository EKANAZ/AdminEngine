"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationFactory = void 0;
class ValidationFactory {
    static create(dtoClass) {
        throw new Error('Cannot instantiate abstract BaseValidation. Please provide a concrete validation implementation.');
    }
}
exports.ValidationFactory = ValidationFactory;
