import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate());
router.get('/', (req, res, next) => inventoryController.getInventory(req, res, next));
router.get('/low-stock', (req, res, next) => inventoryController.getLowStock(req, res, next));
router.get('/movements', (req, res, next) => inventoryController.getMovements(req, res, next));

export default router;
