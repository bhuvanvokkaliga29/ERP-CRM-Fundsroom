import { Request, Response, NextFunction } from 'express';
import { userService, createUserSchema, updateUserSchema } from './user.service';
import { sendSuccess, sendCreated } from '../../utils/response';

export class UserController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await userService.findAll()); } catch (error) { next(error); }
  }
  async findById(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await userService.findById(req.params.id)); } catch (error) { next(error); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUserSchema.parse(req.body);
      sendCreated(res, await userService.create(data, req.user!.userId), 'User created');
    } catch (error) { next(error); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateUserSchema.parse(req.body);
      sendSuccess(res, await userService.update(req.params.id, data, req.user!.userId), 'User updated');
    } catch (error) { next(error); }
  }
}
export const userController = new UserController();
