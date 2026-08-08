import { Router } from 'express';
import { invoiceController } from './invoice.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate());

router.get('/', (req, res, next) => invoiceController.findAll(req, res, next));
router.get('/:id', (req, res, next) => invoiceController.findById(req, res, next));
router.get('/:id/pdf', (req, res, next) => invoiceController.downloadPdf(req, res, next));
router.post('/from-challan/:challanId', authorize('ADMIN', 'SALES', 'ACCOUNTS'), (req, res, next) => invoiceController.createFromChallan(req, res, next));
router.patch('/:id/status', authorize('ADMIN', 'ACCOUNTS'), (req, res, next) => invoiceController.updateStatus(req, res, next));

export default router;
