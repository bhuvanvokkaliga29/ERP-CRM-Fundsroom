import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/response';

export class DashboardController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getDashboard(req.user!.role);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }
}

export const dashboardController = new DashboardController();
