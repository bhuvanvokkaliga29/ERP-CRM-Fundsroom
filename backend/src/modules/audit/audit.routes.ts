import { Router } from 'express';
import { auditController } from './audit.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate(), authorize('ADMIN'));
router.get('/', (req, res, next) => auditController.findAll(req, res, next));

export default router;
