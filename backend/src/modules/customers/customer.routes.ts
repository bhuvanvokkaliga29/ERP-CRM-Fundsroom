import { Router } from 'express';
import { customerController } from './customer.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate());

router.get('/', (req, res, next) => customerController.findAll(req, res, next));
router.get('/:id', (req, res, next) => customerController.findById(req, res, next));
router.post('/', authorize('ADMIN', 'SALES'), (req, res, next) => customerController.create(req, res, next));
router.patch('/:id', authorize('ADMIN', 'SALES'), (req, res, next) => customerController.update(req, res, next));

export default router;
