import { Router } from 'express';
import { aiController } from './ai.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate());
router.post('/copilot', (req, res, next) => aiController.copilot(req, res, next));
router.post('/customers/:customerId/follow-up-draft', (req, res, next) => aiController.followUpDraft(req, res, next));

export default router;
