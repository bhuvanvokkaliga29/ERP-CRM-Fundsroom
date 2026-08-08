import { Router } from 'express';
import { challanController } from './challan.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate());

router.get('/', (req, res, next) => challanController.findAll(req, res, next));
router.get('/:id', (req, res, next) => challanController.findById(req, res, next));
router.post('/', authorize('ADMIN', 'SALES'), (req, res, next) => challanController.create(req, res, next));
router.patch('/:id', authorize('ADMIN', 'SALES'), (req, res, next) => challanController.update(req, res, next));
router.post('/:id/confirm', authorize('ADMIN', 'SALES'), (req, res, next) => challanController.confirm(req, res, next));
router.post('/:id/cancel', authorize('ADMIN', 'SALES'), (req, res, next) => challanController.cancel(req, res, next));

export default router;
