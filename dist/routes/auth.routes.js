"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// Async handler wrapper to handle promises and errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Public routes
router.post('/register', (0, validation_middleware_1.validateRequest)(auth_validation_1.registerSchema), authController.register.bind(authController));
router.post('/login', (0, validation_middleware_1.validateRequest)(auth_validation_1.loginSchema), authController.login.bind(authController));
// Protected routes
router.post('/roles', auth_middleware_1.authenticate, (0, auth_middleware_1.checkPermission)('roles', 'create'), asyncHandler(authController.createRole.bind(authController)));
router.post('/assign-role', auth_middleware_1.authenticate, (0, auth_middleware_1.checkPermission)('roles', 'assign'), asyncHandler(authController.assignRole.bind(authController)));
exports.default = router;
