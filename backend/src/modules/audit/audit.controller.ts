import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendPaginated, parsePaginationQuery } from '../../utils/response';
import { Prisma } from '@prisma/client';

export class AuditController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePaginationQuery(req.query);
      const where: Prisma.AuditLogWhereInput = {};
      if (req.query.action) where.action = req.query.action as string;
      if (req.query.entityType) where.entityType = req.query.entityType as string;
      if (req.query.userId) where.userId = req.query.userId as string;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where, orderBy: { createdAt: 'desc' },
          skip, take: limit,
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        prisma.auditLog.count({ where }),
      ]);
      sendPaginated(res, logs, { page, limit, total });
    } catch (error) { next(error); }
  }
}

export const auditController = new AuditController();
