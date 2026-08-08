import { Request, Response, NextFunction } from 'express';
import { returnService } from './return.service';
import { sendSuccess, sendCreated, sendPaginated, parsePaginationQuery } from '../../utils/response';
import { z } from 'zod';

const createReturnSchema = z.object({
  challanId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  reason: z.string().max(500).optional(),
});

export class ReturnController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePaginationQuery(req.query);
      const { returns, total } = await returnService.findAll({
        page, limit, skip, status: req.query.status as string,
      });
      sendPaginated(res, returns, { page, limit, total });
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createReturnSchema.parse(req.body);
      const result = await returnService.create(data, req.user!.userId);
      sendCreated(res, result, 'Sales return processed successfully');
    } catch (error) { next(error); }
  }
}

export const returnController = new ReturnController();
