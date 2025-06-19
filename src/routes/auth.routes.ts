import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, checkPermission } from '../middlewares/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';

const router = Router();
const authController = new AuthController();

// Async handler wrapper to handle promises and errors
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register.bind(authController));
router.post('/login', validateRequest(loginSchema), authController.login.bind(authController));

// Protected routes
router.post('/roles', 
  authenticate, 
  checkPermission('roles', 'create'),
  asyncHandler(authController.createRole.bind(authController))
);

router.post('/assign-role',
  authenticate,
  checkPermission('roles', 'assign'),
  asyncHandler(authController.assignRole.bind(authController))
);

export default router; 