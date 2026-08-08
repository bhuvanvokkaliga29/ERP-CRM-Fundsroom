import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendPaginated, parsePaginationQuery } from '../../utils/response';

export class NotificationController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePaginationQuery(req.query);
      const where = { userId: req.user!.userId };
      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { ...where, isRead: false } }),
      ]);
      sendPaginated(res, notifications.map(n => ({ ...n, unreadCount })), { page, limit, total });
    } catch (error) { next(error); }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await prisma.notification.count({ where: { userId: req.user!.userId, isRead: false } });
      sendSuccess(res, { unreadCount: count });
    } catch (error) { next(error); }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
      sendSuccess(res, null, 'Notification marked as read');
    } catch (error) { next(error); }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.notification.updateMany({ where: { userId: req.user!.userId, isRead: false }, data: { isRead: true } });
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) { next(error); }
  }
}

export const notificationController = new NotificationController();
