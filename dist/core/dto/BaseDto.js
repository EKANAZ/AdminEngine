"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDto = void 0;
const class_validator_1 = require("class-validator");
const BaseError_1 = require("../errors/BaseError");
class BaseDto {
    async validate() {
        const errors = await (0, class_validator_1.validate)(this);
        if (errors.length > 0) {
            throw new BaseError_1.ValidationError('Validation failed', errors);
        }
    }
}
exports.BaseDto = BaseDto;
