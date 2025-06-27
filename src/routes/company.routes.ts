import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';

const router = Router();
const controller = new CompanyController();

router.get('/', controller.listCompanies.bind(controller));
router.get('/:id', controller.getCompany.bind(controller));
router.put('/:id', controller.updateCompany.bind(controller));
router.delete('/:id', controller.deleteCompany.bind(controller));
router.get('/:id/subscription', controller.getSubscription.bind(controller));
router.post('/:id/plan', controller.changePlan.bind(controller));
router.get('/backup', controller.downloadBackup.bind(controller));

export default router; 