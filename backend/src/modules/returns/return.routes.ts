import { Router } from 'express';
import { returnController } from './return.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate());
router.get('/', (req, res, next) => returnController.findAll(req, res, next));
router.post('/', authorize('ADMIN', 'SALES'), (req, res, next) => returnController.create(req, res, next));

export default router;
