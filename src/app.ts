import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import { initializeMainDatabase } from './config/database';
import logger from './config/logger';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import userRoutes from './routes/user.routes';
import clientRoutes from './routes/client.routes';
import clientSyncRoutes from './routes/sync.routes';
import clientErpRoutes from './routes/client-erp.routes';
import permissionRoutes from './routes/permission.routes';
import roleRoutes from './routes/role.routes';
import { jwtDecode } from 'jwt-decode';
import { SyncRegistry } from './core/sync/SyncRegistry';
import { User } from './models/User';

// Load environment variables
config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Request logging
app.use((_req, _res, next) => {
    logger.info(`${_req.method} ${_req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/client/sync', clientSyncRoutes);
app.use('/api/client-erp', clientErpRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);

// Print all registered routes for debugging
// Print all registered routes for debugging
(app._router.stack as any[])
  .filter((r: any) => r.route)
  .forEach((r: any) => {
    const methods = Object.keys(r.route.methods).join(',').toUpperCase();
    console.log(`${methods} ${r.route.path}`);
  });
// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, _res, next) => {
    console.error(`404 Not Found: ${_req.method} ${_req.originalUrl}`);
    _res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Register sync entities
        // SyncRegistry.register(users_client);
        SyncRegistry.register(User);
        // Initialize database
        await initializeMainDatabase();
        
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
    process.exit(1);
});

startServer(); 