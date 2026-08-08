import { Router } from 'express';
import { productController } from './product.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { upload } from '../../utils/s3.upload';

const router = Router();

router.use(authenticate());

router.get('/', (req, res, next) => productController.findAll(req, res, next));
router.get('/categories', (req, res, next) => productController.getCategories(req, res, next));
router.get('/warehouses', (req, res, next) => productController.getWarehouses(req, res, next));
router.get('/:id', (req, res, next) => productController.findById(req, res, next));
router.get('/:id/movements', (req, res, next) => productController.getMovements(req, res, next));
router.post('/', authorize('ADMIN', 'WAREHOUSE'), (req, res, next) => productController.create(req, res, next));
router.patch('/:id', authorize('ADMIN', 'WAREHOUSE'), (req, res, next) => productController.update(req, res, next));
router.post('/:id/adjust-stock', authorize('ADMIN', 'WAREHOUSE'), (req, res, next) => productController.adjustStock(req, res, next));
router.post('/:id/image', authorize('ADMIN', 'WAREHOUSE'), upload.single('image'), (req, res, next) => productController.uploadImage(req, res, next));

export default router;
