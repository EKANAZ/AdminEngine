import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';
// import { loginRateLimiter } from '../middleware/rateLimit.middleware';

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
  authorize(['roles:create']),
  asyncHandler(authController.createRole.bind(authController))
);

router.post('/assign-role',
  authenticate,
  authorize(['roles:assign']),
  asyncHandler(authController.assignRole.bind(authController))
);

// Refresh token route
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const authService = new (await import('../services/auth.service')).AuthService();
    const result = await authService.refreshAccessToken(refreshToken);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      const authService = new (await import('../services/auth.service')).AuthService();
      await authService.logout(refreshToken);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

export default router; 