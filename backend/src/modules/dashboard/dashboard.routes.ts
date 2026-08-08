import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate());
router.get('/', (req, res, next) => dashboardController.getDashboard(req, res, next));

export default router;
