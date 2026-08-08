import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate());
router.get('/sales', (req, res, next) => analyticsController.getSales(req, res, next));
router.get('/customers', (req, res, next) => analyticsController.getCustomers(req, res, next));
router.get('/inventory', (req, res, next) => analyticsController.getInventory(req, res, next));

export default router;
