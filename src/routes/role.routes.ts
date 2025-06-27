import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';

const router = Router();
const controller = new RoleController();

router.get('/', controller.listRoles.bind(controller));
router.get('/:id', controller.getRole.bind(controller));
router.post('/', controller.createRole.bind(controller));
router.put('/:id', controller.updateRole.bind(controller));
router.delete('/:id', controller.deleteRole.bind(controller));

export default router; 