"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseValidation = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class BaseValidation {
    constructor(dtoClass) {
        this.dtoClass = dtoClass;
    }
    async validate(req, res, next) {
        const dtoObject = (0, class_transformer_1.plainToClass)(this.dtoClass, req.body);
        const errors = await (0, class_validator_1.validate)(dtoObject);
        if (errors.length > 0) {
            const validationErrors = errors.map(error => ({
                property: error.property,
                constraints: error.constraints
            }));
            res.status(400).json({ errors: validationErrors });
            return;
        }
        req.body = dtoObject;
        next();
    }
}
exports.BaseValidation = BaseValidation;
