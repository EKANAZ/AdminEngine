import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const clientController = new ClientController();

// Async handler wrapper
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Client authentication routes
router.post('/login', 
  asyncHandler(clientController.login.bind(clientController))
);

// Client data sync routes
router.post('/sync/pull',
  authenticate,
  asyncHandler(clientController.pullData.bind(clientController))
);

router.post('/sync/push',
  authenticate,
  asyncHandler(clientController.pushData.bind(clientController))
);

router.get('/sync/status',
  authenticate,
  asyncHandler(clientController.getSyncStatus.bind(clientController))
);

export default router;