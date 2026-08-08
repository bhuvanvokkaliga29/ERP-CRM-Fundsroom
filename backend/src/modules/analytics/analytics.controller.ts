import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../utils/response';

export class AnalyticsController {
  async getSales(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getSalesAnalytics({
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      });
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getCustomerAnalytics();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getInventoryAnalytics();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }
}

export const analyticsController = new AnalyticsController();
