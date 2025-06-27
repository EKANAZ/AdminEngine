import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
// import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new UserController();

// router.use(authMiddleware); // Uncomment when auth middleware is ready

// Only authenticated superadmins can create users
router.post('/', authenticate, authorize(['superadmin']), controller.registerUser.bind(controller));

router.get('/', controller.listUsers.bind(controller));
router.get('/:id', controller.getUser.bind(controller));
router.post('/invite', controller.inviteUser.bind(controller));
router.put('/:id', controller.updateUser.bind(controller));
router.patch('/:id/status', controller.setUserStatus.bind(controller));
router.delete('/:id', controller.deleteUser.bind(controller));

export default router; 