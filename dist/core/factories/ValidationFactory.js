"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationFactory = void 0;
const BaseValidation_1 = require("../validations/BaseValidation");
class ValidationFactory {
    static create(dtoClass) {
        return new BaseValidation_1.BaseValidation(dtoClass);
    }
}
exports.ValidationFactory = ValidationFactory;
