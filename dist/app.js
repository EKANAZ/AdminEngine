"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = require("dotenv");
const database_1 = require("./config/database");
const logger_1 = __importDefault(require("./config/logger"));
const error_middleware_1 = require("./middleware/error.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const company_routes_1 = __importDefault(require("./routes/company.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const client_routes_1 = __importDefault(require("./routes/client.routes"));
const sync_routes_1 = __importDefault(require("./routes/client/sync.routes"));
const permission_routes_1 = __importDefault(require("./routes/permission.routes"));
const role_routes_1 = __importDefault(require("./routes/role.routes"));
const SyncRegistry_1 = require("./core/sync/SyncRegistry");
const Customer_1 = require("./modules/crm/entities/Customer");
const User_1 = require("./models/User");
// Load environment variables
(0, dotenv_1.config)();
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Request logging
app.use((_req, _res, next) => {
    logger_1.default.info(`${_req.method} ${_req.url}`);
    next();
});
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/companies', company_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/client', client_routes_1.default);
app.use('/api/client/sync', sync_routes_1.default);
app.use('/api/roles', role_routes_1.default);
app.use('/api/permissions', permission_routes_1.default);
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 404 handler
app.use((_req, _res, next) => {
    _res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});
// Error handling
app.use(error_middleware_1.errorHandler);
// Start server
const PORT = process.env.PORT || 3000;
const startServer = async () => {
    try {
        // Register sync entities
        SyncRegistry_1.SyncRegistry.register(Customer_1.Customer);
        SyncRegistry_1.SyncRegistry.register(User_1.User);
        // Initialize database
        await (0, database_1.initializeMainDatabase)();
        app.listen(PORT, () => {
            logger_1.default.info(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception:', error);
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger_1.default.error('Unhandled Rejection:', error);
    process.exit(1);
});
startServer();
