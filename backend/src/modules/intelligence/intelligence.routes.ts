import { Router } from 'express';
import { intelligenceController } from './intelligence.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate());
router.get('/business-brief', (req, res, next) => intelligenceController.getBusinessBrief(req, res, next));
router.get('/next-actions', (req, res, next) => intelligenceController.getNextActions(req, res, next));
router.get('/inventory/recommendations', (req, res, next) => intelligenceController.getInventoryRecommendations(req, res, next));
router.get('/customers/:id', (req, res, next) => intelligenceController.getCustomerIntelligence(req, res, next));

export default router;
