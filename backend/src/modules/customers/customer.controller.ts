import { Request, Response, NextFunction } from 'express';
import { customerService } from './customer.service';
import { createCustomerSchema, updateCustomerSchema } from './customer.validator';
import { sendSuccess, sendCreated, sendPaginated, parsePaginationQuery } from '../../utils/response';

export class CustomerController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePaginationQuery(req.query);
      const { customers, total } = await customerService.findAll({
        page,
        limit,
        skip,
        search: req.query.search as string,
        status: req.query.status as string,
        customerType: req.query.customerType as string,
        followUpState: req.query.followUpState as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      });
      sendPaginated(res, customers, { page, limit, total });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.findById(req.params.id);
      sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCustomerSchema.parse(req.body);
      const customer = await customerService.create(data, req.user!.userId);
      sendCreated(res, customer, 'Customer created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCustomerSchema.parse(req.body);
      const customer = await customerService.update(req.params.id, data, req.user!.userId);
      sendSuccess(res, customer, 'Customer updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const customerController = new CustomerController();
