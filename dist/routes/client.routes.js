"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_controller_1 = require("../controllers/client.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const clientController = new client_controller_1.ClientController();
// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Client authentication routes
router.post('/login', asyncHandler(clientController.login.bind(clientController)));
// Client data sync routes
router.post('/sync/pull', auth_middleware_1.authenticate, asyncHandler(clientController.pullData.bind(clientController)));
router.post('/sync/push', auth_middleware_1.authenticate, asyncHandler(clientController.pushData.bind(clientController)));
router.get('/sync/status', auth_middleware_1.authenticate, asyncHandler(clientController.getSyncStatus.bind(clientController)));
exports.default = router;
