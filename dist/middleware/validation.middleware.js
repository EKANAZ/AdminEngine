"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const logger_1 = __importDefault(require("../config/logger"));
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            logger_1.default.error('Validation error:', error.details);
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
        return;
    };
};
exports.validateRequest = validateRequest;
