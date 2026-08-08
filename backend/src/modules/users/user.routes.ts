import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate(), authorize('ADMIN'));
router.get('/', (req, res, next) => userController.findAll(req, res, next));
router.get('/:id', (req, res, next) => userController.findById(req, res, next));
router.post('/', (req, res, next) => userController.create(req, res, next));
router.patch('/:id', (req, res, next) => userController.update(req, res, next));

export default router;
