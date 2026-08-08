import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { CreateFollowUpInput, UpdateFollowUpInput } from './followup.validator';
import { Prisma } from '@prisma/client';

export class FollowUpService {
  async findAll(params: {
    page: number;
    limit: number;
    skip: number;
    status?: string;
    assignedToId?: string;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: Prisma.CustomerFollowUpWhereInput = {};

    if (params.status) where.status = params.status as any;
    if (params.assignedToId) where.assignedToId = params.assignedToId;
    if (params.customerId) where.customerId = params.customerId;
    if (params.dateFrom || params.dateTo) {
      where.scheduledAt = {};
      if (params.dateFrom) where.scheduledAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.scheduledAt.lte = new Date(params.dateTo);
    }

    const [followUps, total] = await Promise.all([
      prisma.customerFollowUp.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip: params.skip,
        take: params.limit,
        include: {
          customer: { select: { id: true, customerName: true, businessName: true, status: true } },
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.customerFollowUp.count({ where }),
    ]);

    return { followUps, total };
  }

  async getDashboard(userId?: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const baseWhere: Prisma.CustomerFollowUpWhereInput = userId
      ? { assignedToId: userId }
      : {};

    const [todayFollowUps, overdueFollowUps, upcomingFollowUps, recentCompleted] = await Promise.all([
      prisma.customerFollowUp.findMany({
        where: {
          ...baseWhere,
          scheduledAt: { gte: today, lt: tomorrow },
          status: { in: ['SCHEDULED', 'OVERDUE'] },
        },
        include: {
          customer: { select: { id: true, customerName: true, businessName: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { scheduledAt: 'asc' },
      }),
      prisma.customerFollowUp.findMany({
        where: {
          ...baseWhere,
          scheduledAt: { lt: today },
          status: { in: ['SCHEDULED', 'OVERDUE'] },
        },
        include: {
          customer: { select: { id: true, customerName: true, businessName: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { scheduledAt: 'asc' },
      }),
      prisma.customerFollowUp.findMany({
        where: {
          ...baseWhere,
          scheduledAt: { gte: tomorrow, lte: nextWeek },
          status: 'SCHEDULED',
        },
        include: {
          customer: { select: { id: true, customerName: true, businessName: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 20,
      }),
      prisma.customerFollowUp.findMany({
        where: {
          ...baseWhere,
          status: 'COMPLETED',
        },
        include: {
          customer: { select: { id: true, customerName: true, businessName: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),
    ]);

    // Mark overdue follow-ups
    if (overdueFollowUps.length > 0) {
      await prisma.customerFollowUp.updateMany({
        where: {
          id: { in: overdueFollowUps.map(f => f.id) },
          status: 'SCHEDULED',
        },
        data: { status: 'OVERDUE' },
      });
    }

    return {
      today: todayFollowUps,
      overdue: overdueFollowUps,
      upcoming: upcomingFollowUps,
      recentCompleted,
      counts: {
        today: todayFollowUps.length,
        overdue: overdueFollowUps.length,
        upcoming: upcomingFollowUps.length,
      },
    };
  }

  async create(data: CreateFollowUpInput, createdById: string) {
    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId: data.customerId,
        assignedToId: data.assignedToId,
        scheduledAt: new Date(data.scheduledAt),
        type: data.type,
        note: data.note,
        createdById,
      },
      include: {
        customer: { select: { id: true, customerName: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Update customer followUpDate
    await prisma.customer.update({
      where: { id: data.customerId },
      data: { followUpDate: new Date(data.scheduledAt) },
    });

    await prisma.auditLog.create({
      data: {
        userId: createdById,
        action: 'FOLLOWUP_CREATED',
        entityType: 'CUSTOMER_FOLLOWUP',
        entityId: followUp.id,
        newValues: followUp as any,
      },
    });

    return followUp;
  }

  async update(id: string, data: UpdateFollowUpInput, userId: string) {
    const existing = await prisma.customerFollowUp.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('FollowUp', id);

    const updateData: any = { ...data };
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
    if (data.status === 'COMPLETED') updateData.completedAt = new Date();

    const updated = await prisma.customerFollowUp.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, customerName: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  async getByCustomerId(customerId: string) {
    return prisma.customerFollowUp.findMany({
      where: { customerId },
      orderBy: { scheduledAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }
}

export const followUpService = new FollowUpService();
