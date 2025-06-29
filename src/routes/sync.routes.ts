import { Router } from 'express';
import { SyncController } from '../controllers/client/sync.controller';
import { App } from '../core/Application';
import { authenticateToken } from '../middleware/auth.middleware';

// This will be set by the app.ts when creating routes
let syncController: SyncController;

export const initializeSyncRoutes = (app: App) => {
  syncController = new SyncController(app);
};

// Create a function that returns the router with proper controller initialization
export const createSyncRoutes = (notificationService: any, app?: App) => {
  const router = Router();
  
  console.log('Creating sync routes...');
  
  // Initialize controller with app instance for WebSocket notifications
  syncController = new SyncController(app);
  
  console.log('Sync controller initialized successfully');
  
  // Add a test route to verify registration
  router.get('/test', (req, res) => {
    console.log('Sync test route hit!');
    res.json({ success: true, message: 'Sync routes are working!' });
  });
  
  // Add a health check route
  router.get('/health', (req, res) => {
    console.log('Sync health check route hit!');
    res.json({ 
      success: true, 
      message: 'Sync service is healthy',
      timestamp: new Date().toISOString(),
      controller: syncController ? 'initialized' : 'not initialized'
    });
  });
  
  // Helper function to check if controller is initialized
  const ensureController = () => {
    if (!syncController) {
      console.error('Sync controller is undefined!');
      throw new Error('Sync controller not initialized');
    }
    return syncController;
  };
  
  // Define routes with error handling and authentication
  router.post('/pull', authenticateToken, async (req, res) => {
    console.log('Sync pull request received');
    try {
      const controller = ensureController();
      await controller.pullData(req, res);
    } catch (error) {
      console.error('Sync pull error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error during sync pull' 
      });
    }
  });
  
  router.post('/pull-pending', authenticateToken, async (req, res) => {
    console.log('Sync pull-pending request received');
    try {
      const controller = ensureController();
      await controller.pullPendingData(req, res);
    } catch (error) {
      console.error('Sync pull-pending error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error during sync pull-pending' 
      });
    }
  });
  
  router.post('/push', authenticateToken, async (req, res) => {
    console.log('Sync push request received');
    try {
      const controller = ensureController();
      await controller.pushData(req, res);
    } catch (error) {
      console.error('Sync push error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error during sync push' 
      });
    }
  });
  
  console.log('Sync routes created successfully');
  return router;
};

// Default export for backward compatibility
const router = Router();
export default router; 