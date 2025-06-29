import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import { createServer } from 'http';
import { initializeMainDatabase } from './config/database';
import logger from './config/logger';
import { errorHandler } from './middleware/error.middleware';
import { SyncNotificationService } from './services/sync-notification.service';
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import userRoutes from './routes/user.routes';
import clientRoutes from './routes/client.routes';
import clientSyncRoutes, { createSyncRoutes } from './routes/sync.routes';
import clientErpRoutes from './routes/client-erp.routes';
import permissionRoutes from './routes/permission.routes';
import roleRoutes from './routes/role.routes';
import { jwtDecode } from 'jwt-decode';
import { SyncRegistry } from './core/sync/SyncRegistry';
import { User } from './models/User';

// Load environment variables
config();

const app = express();
const httpServer = createServer(app);

// Initialize sync notification service
const syncNotificationService = new SyncNotificationService(httpServer);

// Create sync routes with notification service
console.log('Initializing sync routes...');
const syncRoutes = createSyncRoutes(syncNotificationService);
console.log('Sync routes initialized successfully');

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
app.use('/api/client/sync', syncRoutes);
app.use('/api/client-erp', clientErpRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connectedClients: syncNotificationService.getConnectedClientsCount(),
    connectedTenants: syncNotificationService.getConnectedTenants()
  });
});

// Debug: Print all registered routes
console.log('\n=== REGISTERED ROUTES ===');
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    // Routes registered directly on the app
    const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
    console.log(`${methods} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // Router middleware
    console.log(`Router mounted at: ${middleware.regexp}`);
    middleware.handle.stack.forEach((handler: any) => {
      if (handler.route) {
        const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
        console.log(`  ${methods} ${handler.route.path}`);
      }
    });
  }
});
console.log('=== END REGISTERED ROUTES ===\n');

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
        // Initialize database
        await initializeMainDatabase();
        
        httpServer.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`WebSocket sync notifications enabled`);
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