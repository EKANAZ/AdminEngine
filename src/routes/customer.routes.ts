import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new CustomerController();

router.post('/register', controller.registerCustomer.bind(controller));
router.post('/login', controller.loginCustomer.bind(controller));

export default router; 