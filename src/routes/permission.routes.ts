import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';

const router = Router();
const controller = new PermissionController();

router.get('/', controller.listPermissions.bind(controller));
router.get('/:id', controller.getPermission.bind(controller));
router.post('/', controller.createPermission.bind(controller));
router.put('/:id', controller.updatePermission.bind(controller));
router.delete('/:id', controller.deletePermission.bind(controller));

export default router; 