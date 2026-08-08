import { Request, Response, NextFunction } from 'express';
import { productService } from './product.service';
import { createProductSchema, updateProductSchema, adjustStockSchema } from './product.validator';
import { sendSuccess, sendCreated, sendPaginated, parsePaginationQuery } from '../../utils/response';
import { uploadToS3 } from '../../utils/s3.upload';

export class ProductController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePaginationQuery(req.query);
      const { products, total } = await productService.findAll({
        page, limit, skip,
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        warehouseId: req.query.warehouseId as string,
        status: req.query.status as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      });
      sendPaginated(res, products, { page, limit, total });
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.findById(req.params.id);
      sendSuccess(res, product);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProductSchema.parse(req.body);
      const product = await productService.create(data, req.user!.userId);
      sendCreated(res, product, 'Product created successfully');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateProductSchema.parse(req.body);
      const product = await productService.update(req.params.id, data, req.user!.userId);
      sendSuccess(res, product, 'Product updated successfully');
    } catch (error) { next(error); }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const data = adjustStockSchema.parse(req.body);
      const result = await productService.adjustStock(req.params.id, data, req.user!.userId);
      sendSuccess(res, result, 'Stock adjusted successfully');
    } catch (error) { next(error); }
  }

  async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePaginationQuery(req.query);
      const { movements, total } = await productService.getMovements(req.params.id, { page, limit, skip });
      sendPaginated(res, movements, { page, limit, total });
    } catch (error) { next(error); }
  }

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await productService.getCategories();
      sendSuccess(res, categories);
    } catch (error) { next(error); }
  }

  async getWarehouses(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouses = await productService.getWarehouses();
      sendSuccess(res, warehouses);
    } catch (error) { next(error); }
  }

  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No image file provided' });
      }
      
      const imageUrl = await uploadToS3(req.file);
      
      // Update product with image URL in database
      const product = await productService.update(req.params.id, { imageUrl }, req.user!.userId);
      
      sendSuccess(res, product, 'Image uploaded successfully to AWS S3');
    } catch (error) { next(error); }
  }
}

export const productController = new ProductController();
