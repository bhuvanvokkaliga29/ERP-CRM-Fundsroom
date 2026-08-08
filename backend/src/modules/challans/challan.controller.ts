import { Request, Response, NextFunction } from 'express';
import { challanService } from './challan.service';
import { createChallanSchema, updateChallanSchema } from './challan.validator';
import { sendSuccess, sendCreated, sendPaginated, parsePaginationQuery } from '../../utils/response';

export class ChallanController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePaginationQuery(req.query);
      const { challans, total } = await challanService.findAll({
        page, limit, skip,
        search: req.query.search as string,
        status: req.query.status as string,
        customerId: req.query.customerId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      });
      sendPaginated(res, challans, { page, limit, total });
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const challan = await challanService.findById(req.params.id);
      sendSuccess(res, challan);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createChallanSchema.parse(req.body);
      const challan = await challanService.create(data, req.user!.userId);
      sendCreated(res, challan, 'Challan created successfully');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateChallanSchema.parse(req.body);
      const challan = await challanService.update(req.params.id, data, req.user!.userId);
      sendSuccess(res, challan, 'Challan updated successfully');
    } catch (error) { next(error); }
  }

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const challan = await challanService.confirm(req.params.id, req.user!.userId);
      sendSuccess(res, challan, 'Challan confirmed successfully');
    } catch (error) { next(error); }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const challan = await challanService.cancel(req.params.id, req.user!.userId);
      sendSuccess(res, challan, 'Challan cancelled successfully');
    } catch (error) { next(error); }
  }
}

export const challanController = new ChallanController();
