import { Router } from 'express';
import { followUpController } from './followup.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate());

router.get('/', (req, res, next) => followUpController.findAll(req, res, next));
router.get('/dashboard', (req, res, next) => followUpController.getDashboard(req, res, next));
router.get('/customer/:customerId', (req, res, next) => followUpController.getByCustomerId(req, res, next));
router.post('/', authorize('ADMIN', 'SALES'), (req, res, next) => followUpController.create(req, res, next));
router.patch('/:id', authorize('ADMIN', 'SALES'), (req, res, next) => followUpController.update(req, res, next));

export default router;
