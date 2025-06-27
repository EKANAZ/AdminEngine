import { Router } from 'express';
import { SyncController } from '../controllers/client/sync.controller';
// import { clientAuthMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const controller = new SyncController();

// router.use(clientAuthMiddleware); // Uncomment when ready

router.post('/pull', controller.pullData.bind(controller));
router.post('/push', controller.pushData.bind(controller));

export default router; 