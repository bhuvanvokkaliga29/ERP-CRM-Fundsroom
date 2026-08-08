import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service';
import { sendSuccess, sendPaginated, parsePaginationQuery } from '../../utils/response';

export class InventoryController {
  async getInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePaginationQuery(req.query);
      const { products, total, summary } = await inventoryService.getInventory({
        page, limit, skip,
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        warehouseId: req.query.warehouseId as string,
        stockStatus: req.query.stockStatus as string,
      });
      res.json({
        success: true,
        data: { products, summary },
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) { next(error); }
  }

  async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await inventoryService.getLowStock();
      sendSuccess(res, products);
    } catch (error) { next(error); }
  }

  async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePaginationQuery(req.query);
      const { movements, total } = await inventoryService.getStockMovements({
        page, limit, skip,
        productId: req.query.productId as string,
        movementType: req.query.movementType as string,
        reason: req.query.reason as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      });
      sendPaginated(res, movements, { page, limit, total });
    } catch (error) { next(error); }
  }
}

export const inventoryController = new InventoryController();
