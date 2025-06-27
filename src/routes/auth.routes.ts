import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import { loginRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
const authController = new AuthController();

// Async handler wrapper to handle promises and errors
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register.bind(authController));
router.post('/login', loginRateLimiter, validateRequest(loginSchema), authController.login.bind(authController));

// Protected routes
router.post('/roles', 
  authenticate, 
  authorize(['roles:create']),
  asyncHandler(authController.createRole.bind(authController))
);

router.post('/assign-role',
  authenticate,
  authorize(['roles:assign']),
  asyncHandler(authController.assignRole.bind(authController))
);

export default router; 