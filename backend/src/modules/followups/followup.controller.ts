import { Request, Response, NextFunction } from 'express';
import { followUpService } from './followup.service';
import { createFollowUpSchema, updateFollowUpSchema } from './followup.validator';
import { sendSuccess, sendCreated, sendPaginated, parsePaginationQuery } from '../../utils/response';

export class FollowUpController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePaginationQuery(req.query);
      const { followUps, total } = await followUpService.findAll({
        page, limit, skip,
        status: req.query.status as string,
        assignedToId: req.query.assignedToId as string,
        customerId: req.query.customerId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      });
      sendPaginated(res, followUps, { page, limit, total });
    } catch (error) { next(error); }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.query.all === 'true' ? undefined : req.user!.userId;
      const dashboard = await followUpService.getDashboard(userId);
      sendSuccess(res, dashboard);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createFollowUpSchema.parse(req.body);
      const followUp = await followUpService.create(data, req.user!.userId);
      sendCreated(res, followUp, 'Follow-up created successfully');
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateFollowUpSchema.parse(req.body);
      const followUp = await followUpService.update(req.params.id, data, req.user!.userId);
      sendSuccess(res, followUp, 'Follow-up updated successfully');
    } catch (error) { next(error); }
  }

  async getByCustomerId(req: Request, res: Response, next: NextFunction) {
    try {
      const followUps = await followUpService.getByCustomerId(req.params.customerId);
      sendSuccess(res, followUps);
    } catch (error) { next(error); }
  }
}

export const followUpController = new FollowUpController();
