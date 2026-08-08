import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { CreateCustomerInput, UpdateCustomerInput } from './customer.validator';
import { Prisma } from '@prisma/client';

export class CustomerService {
  async findAll(params: {
    page: number;
    limit: number;
    skip: number;
    search?: string;
    status?: string;
    customerType?: string;
    followUpState?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: Prisma.CustomerWhereInput = {};

    if (params.search) {
      where.OR = [
        { customerName: { contains: params.search, mode: 'insensitive' } },
        { businessName: { contains: params.search, mode: 'insensitive' } },
        { mobileNumber: { contains: params.search } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { gstNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.status) {
      where.status = params.status as any;
    }

    if (params.customerType) {
      where.customerType = params.customerType as any;
    }

    if (params.followUpState) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      switch (params.followUpState) {
        case 'DUE_TODAY':
          where.followUpDate = { gte: today, lt: tomorrow };
          break;
        case 'OVERDUE':
          where.followUpDate = { lt: today };
          break;
        case 'UPCOMING':
          where.followUpDate = { gte: tomorrow };
          break;
        case 'NONE':
          where.followUpDate = null;
          break;
      }
    }

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    if (params.sortBy) {
      (orderBy as any)[params.sortBy] = params.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.limit,
        include: {
          _count: {
            select: {
              challans: true,
              followUps: true,
              invoices: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    // Calculate lifetime revenue for each customer
    const customersWithRevenue = await Promise.all(
      customers.map(async (customer) => {
        const revenue = await prisma.invoice.aggregate({
          where: {
            customerId: customer.id,
            status: { in: ['ISSUED', 'PAID'] },
          },
          _sum: { grandTotal: true },
        });

        const lastChallan = await prisma.challan.findFirst({
          where: { customerId: customer.id, status: { not: 'CANCELLED' } },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        const nextFollowUp = await prisma.customerFollowUp.findFirst({
          where: {
            customerId: customer.id,
            status: { in: ['SCHEDULED', 'OVERDUE'] },
          },
          orderBy: { scheduledAt: 'asc' },
          select: { scheduledAt: true, status: true },
        });

        return {
          ...customer,
          lifetimeRevenue: revenue._sum.grandTotal?.toNumber() || 0,
          lastActivity: lastChallan?.createdAt || null,
          nextFollowUp: nextFollowUp?.scheduledAt || null,
          nextFollowUpStatus: nextFollowUp?.status || null,
        };
      })
    );

    return { customers: customersWithRevenue, total };
  }

  async findById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { scheduledAt: 'desc' },
          take: 20,
          include: {
            assignedTo: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            items: true,
            createdBy: { select: { id: true, name: true } },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer', id);
    }

    // Calculate metrics
    const [revenueAgg, orderCount, avgOrder] = await Promise.all([
      prisma.invoice.aggregate({
        where: { customerId: id, status: { in: ['ISSUED', 'PAID'] } },
        _sum: { grandTotal: true },
      }),
      prisma.challan.count({
        where: { customerId: id, status: { not: 'CANCELLED' } },
      }),
      prisma.invoice.aggregate({
        where: { customerId: id, status: { in: ['ISSUED', 'PAID'] } },
        _avg: { grandTotal: true },
      }),
    ]);

    const lastPurchase = await prisma.challan.findFirst({
      where: { customerId: id, status: 'CONFIRMED' },
      orderBy: { confirmedAt: 'desc' },
      select: { confirmedAt: true },
    });

    const followUpCompletion = await prisma.customerFollowUp.groupBy({
      by: ['status'],
      where: { customerId: id },
      _count: true,
    });

    const totalFollowUps = followUpCompletion.reduce((sum, f) => sum + f._count, 0);
    const completedFollowUps = followUpCompletion.find(f => f.status === 'COMPLETED')?._count || 0;

    const daysSincePurchase = lastPurchase?.confirmedAt
      ? Math.floor((Date.now() - lastPurchase.confirmedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      ...customer,
      metrics: {
        lifetimeRevenue: revenueAgg._sum.grandTotal?.toNumber() || 0,
        totalOrders: orderCount,
        averageOrderValue: avgOrder._avg.grandTotal?.toNumber() || 0,
        lastPurchase: lastPurchase?.confirmedAt || null,
        daysSincePurchase,
        followUpCompletionRate: totalFollowUps > 0
          ? Math.round((completedFollowUps / totalFollowUps) * 100)
          : null,
      },
    };
  }

  async create(data: CreateCustomerInput, userId: string) {
    const customer = await prisma.customer.create({
      data: {
        ...data,
        email: data.email || null,
        businessName: data.businessName || null,
        gstNumber: data.gstNumber || null,
        address: data.address || null,
        notes: data.notes || null,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CUSTOMER_CREATED',
        entityType: 'CUSTOMER',
        entityId: customer.id,
        newValues: customer as any,
      },
    });

    return customer;
  }

  async update(id: string, data: UpdateCustomerInput, userId: string) {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Customer', id);
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        followUpDate: data.followUpDate !== undefined
          ? (data.followUpDate ? new Date(data.followUpDate) : null)
          : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CUSTOMER_UPDATED',
        entityType: 'CUSTOMER',
        entityId: id,
        oldValues: existing as any,
        newValues: updated as any,
      },
    });

    return updated;
  }
}

export const customerService = new CustomerService();
