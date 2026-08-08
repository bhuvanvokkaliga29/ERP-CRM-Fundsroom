import { prisma } from '../../config/database';
import { NotFoundError, ConflictError, InsufficientStockError, InvalidStateTransitionError } from '../../utils/errors';
import { CreateChallanInput, UpdateChallanInput } from './challan.validator';
import { Prisma } from '@prisma/client';

export class ChallanService {
  /**
   * Generate next challan number: CH-YYYY-NNNNNN
   */
  private async generateChallanNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CH-${year}-`;

    const lastChallan = await prisma.challan.findFirst({
      where: { challanNumber: { startsWith: prefix } },
      orderBy: { challanNumber: 'desc' },
      select: { challanNumber: true },
    });

    let nextNum = 1;
    if (lastChallan) {
      const lastNum = parseInt(lastChallan.challanNumber.replace(prefix, ''), 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${nextNum.toString().padStart(6, '0')}`;
  }

  async findAll(params: {
    page: number;
    limit: number;
    skip: number;
    search?: string;
    status?: string;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: Prisma.ChallanWhereInput = {};

    if (params.search) {
      where.OR = [
        { challanNumber: { contains: params.search, mode: 'insensitive' } },
        { customer: { customerName: { contains: params.search, mode: 'insensitive' } } },
        { customer: { businessName: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    if (params.status) where.status = params.status as any;
    if (params.customerId) where.customerId = params.customerId;
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.createdAt.lte = new Date(params.dateTo);
    }

    const orderBy: Prisma.ChallanOrderByWithRelationInput = {};
    if (params.sortBy) {
      (orderBy as any)[params.sortBy] = params.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.limit,
        include: {
          customer: { select: { id: true, customerName: true, businessName: true } },
          createdBy: { select: { id: true, name: true } },
          items: true,
          _count: { select: { items: true } },
        },
      }),
      prisma.challan.count({ where }),
    ]);

    return { challans, total };
  }

  async findById(id: string) {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: {
              select: { id: true, currentStock: true, status: true },
            },
          },
        },
        invoices: true,
        returns: { include: { items: true } },
      },
    });

    if (!challan) throw new NotFoundError('Challan', id);
    return challan;
  }

  async create(data: CreateChallanInput, userId: string) {
    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new NotFoundError('Customer', data.customerId);

    // Fetch product details for snapshots
    const productIds = data.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate all products exist
    for (const item of data.items) {
      if (!productMap.has(item.productId)) {
        throw new NotFoundError('Product', item.productId);
      }
    }

    const challanNumber = await this.generateChallanNumber();

    // Build items with snapshots and calculate totals
    let subtotal = new Prisma.Decimal(0);
    let taxTotal = new Prisma.Decimal(0);

    const challanItems = data.items.map(item => {
      const product = productMap.get(item.productId)!;
      const lineSubtotal = product.unitPrice.mul(item.quantity);
      const lineTax = lineSubtotal.mul(product.taxRate).div(100);
      const lineTotal = lineSubtotal.add(lineTax);

      subtotal = subtotal.add(lineSubtotal);
      taxTotal = taxTotal.add(lineTax);

      return {
        productId: item.productId,
        productNameSnapshot: product.productName,
        skuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        taxRateSnapshot: product.taxRate,
        quantity: item.quantity,
        lineSubtotal,
        lineTax,
        lineTotal,
      };
    });

    const grandTotal = subtotal.add(taxTotal);

    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId: data.customerId,
        subtotal,
        taxTotal,
        grandTotal,
        notes: data.notes,
        createdById: userId,
        items: {
          create: challanItems,
        },
      },
      include: {
        customer: { select: { id: true, customerName: true, businessName: true } },
        items: true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CHALLAN_CREATED',
        entityType: 'CHALLAN',
        entityId: challan.id,
        newValues: {
          challanNumber: challan.challanNumber,
          customerId: challan.customerId,
          grandTotal: grandTotal.toString(),
          itemCount: challanItems.length,
        } as any,
      },
    });

    return challan;
  }

  /**
   * CRITICAL: Atomic challan confirmation with inventory deduction
   *
   * Transaction sequence:
   * 1. Load challan and verify DRAFT status
   * 2. Lock product rows (SELECT FOR UPDATE)
   * 3. Validate ALL quantities against available stock
   * 4. If ANY item lacks inventory → ROLLBACK entire operation
   * 5. Deduct inventory for every item
   * 6. Create OUT stock movement for every item
   * 7. Update challan status to CONFIRMED
   * 8. Create audit event
   * 9. COMMIT
   */
  async confirm(id: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Load challan with items
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true, customer: { select: { customerName: true } } },
      });

      if (!challan) throw new NotFoundError('Challan', id);

      // 2. Verify status is DRAFT (double-confirmation protection)
      if (challan.status === 'CONFIRMED') {
        throw new ConflictError(
          'Challan has already been confirmed',
          'CHALLAN_ALREADY_CONFIRMED',
          { challanNumber: challan.challanNumber }
        );
      }

      if (challan.status !== 'DRAFT') {
        throw new InvalidStateTransitionError('Challan', challan.status, 'CONFIRMED');
      }

      // 3. Lock product rows using SELECT FOR UPDATE for concurrency protection
      const productIds = challan.items.map(item => item.productId);

      // Raw query for row-level locking
      const lockedProducts = await tx.$queryRaw<Array<{ id: string; productName: string; currentStock: number }>>`
        SELECT id, "productName", "currentStock"
        FROM products
        WHERE id = ANY(${productIds}::uuid[])
        ORDER BY id
        FOR UPDATE
      `;

      const productStockMap = new Map(lockedProducts.map(p => [p.id, p]));

      // 4. Validate ALL quantities - check every item before deducting anything
      const insufficientItems: Array<{ productName: string; requested: number; available: number }> = [];

      for (const item of challan.items) {
        const product = productStockMap.get(item.productId);
        if (!product) {
          throw new NotFoundError('Product', item.productId);
        }
        if (product.currentStock < item.quantity) {
          insufficientItems.push({
            productName: product.productName,
            requested: item.quantity,
            available: product.currentStock,
          });
        }
      }

      // If ANY item lacks inventory, ROLLBACK everything
      if (insufficientItems.length > 0) {
        throw new InsufficientStockError(
          insufficientItems[0].productName,
          insufficientItems[0].requested,
          insufficientItems[0].available
        );
      }

      // 5 & 6. Deduct inventory and create stock movements for EVERY item
      for (const item of challan.items) {
        // Atomic stock deduction
        await tx.$executeRaw`
          UPDATE products
          SET "currentStock" = "currentStock" - ${item.quantity},
              "updatedAt" = NOW()
          WHERE id = ${item.productId}::uuid
          AND "currentStock" >= ${item.quantity}
        `;

        // Create OUT stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: 'OUT',
            reason: 'SALES_CHALLAN',
            referenceType: 'CHALLAN',
            referenceId: challan.id,
            createdById: userId,
          },
        });
      }

      // 7. Update challan status
      const confirmed = await tx.challan.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
        include: {
          customer: { select: { id: true, customerName: true, businessName: true } },
          items: true,
          createdBy: { select: { id: true, name: true } },
        },
      });

      // 8. Create audit event
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CHALLAN_CONFIRMED',
          entityType: 'CHALLAN',
          entityId: id,
          newValues: {
            challanNumber: challan.challanNumber,
            customerName: challan.customer.customerName,
            itemCount: challan.items.length,
            grandTotal: challan.grandTotal.toString(),
            confirmedAt: new Date().toISOString(),
          } as any,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId,
          type: 'CHALLAN_CONFIRMED',
          title: 'Challan Confirmed',
          message: `Challan ${challan.challanNumber} confirmed for ${challan.customer.customerName}`,
          entityType: 'CHALLAN',
          entityId: id,
        },
      });

      return confirmed;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15000,
    });
  }

  async cancel(id: string, userId: string) {
    const challan = await prisma.challan.findUnique({ where: { id } });
    if (!challan) throw new NotFoundError('Challan', id);

    if (challan.status !== 'DRAFT') {
      throw new InvalidStateTransitionError('Challan', challan.status, 'CANCELLED');
    }

    const cancelled = await prisma.challan.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
      include: {
        customer: { select: { id: true, customerName: true } },
        items: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CHALLAN_CANCELLED',
        entityType: 'CHALLAN',
        entityId: id,
        newValues: { challanNumber: challan.challanNumber, status: 'CANCELLED' } as any,
      },
    });

    return cancelled;
  }

  async update(id: string, data: UpdateChallanInput, userId: string) {
    const challan = await prisma.challan.findUnique({ where: { id } });
    if (!challan) throw new NotFoundError('Challan', id);

    if (challan.status !== 'DRAFT') {
      throw new InvalidStateTransitionError('Challan', challan.status, 'editing');
    }

    // If items are being updated, rebuild them
    if (data.items) {
      const productIds = data.items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      let subtotal = new Prisma.Decimal(0);
      let taxTotal = new Prisma.Decimal(0);

      const challanItems = data.items.map(item => {
        const product = productMap.get(item.productId)!;
        if (!product) throw new NotFoundError('Product', item.productId);

        const lineSubtotal = product.unitPrice.mul(item.quantity);
        const lineTax = lineSubtotal.mul(product.taxRate).div(100);
        const lineTotal = lineSubtotal.add(lineTax);

        subtotal = subtotal.add(lineSubtotal);
        taxTotal = taxTotal.add(lineTax);

        return {
          productId: item.productId,
          productNameSnapshot: product.productName,
          skuSnapshot: product.sku,
          unitPriceSnapshot: product.unitPrice,
          taxRateSnapshot: product.taxRate,
          quantity: item.quantity,
          lineSubtotal,
          lineTax,
          lineTotal,
        };
      });

      const grandTotal = subtotal.add(taxTotal);

      // Delete old items and create new ones
      await prisma.$transaction(async (tx) => {
        await tx.challanItem.deleteMany({ where: { challanId: id } });

        await tx.challan.update({
          where: { id },
          data: {
            customerId: data.customerId,
            subtotal,
            taxTotal,
            grandTotal,
            notes: data.notes,
            items: { create: challanItems },
          },
        });
      });
    } else {
      await prisma.challan.update({
        where: { id },
        data: {
          customerId: data.customerId,
          notes: data.notes,
        },
      });
    }

    return this.findById(id);
  }
}

export const challanService = new ChallanService();
