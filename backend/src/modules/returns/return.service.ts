import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { Prisma } from '@prisma/client';

export class ReturnService {
  private async generateReturnNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RET-${year}-`;
    const last = await prisma.salesReturn.findFirst({
      where: { returnNumber: { startsWith: prefix } },
      orderBy: { returnNumber: 'desc' },
      select: { returnNumber: true },
    });
    let nextNum = 1;
    if (last) nextNum = parseInt(last.returnNumber.replace(prefix, ''), 10) + 1;
    return `${prefix}${nextNum.toString().padStart(6, '0')}`;
  }

  async findAll(params: { page: number; limit: number; skip: number; status?: string }) {
    const where: Prisma.SalesReturnWhereInput = {};
    if (params.status) where.status = params.status as any;

    const [returns, total] = await Promise.all([
      prisma.salesReturn.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: params.skip, take: params.limit,
        include: {
          challan: { select: { id: true, challanNumber: true } },
          customer: { select: { id: true, customerName: true, businessName: true } },
          createdBy: { select: { id: true, name: true } },
          items: true,
        },
      }),
      prisma.salesReturn.count({ where }),
    ]);
    return { returns, total };
  }

  async create(data: {
    challanId: string;
    items: Array<{ productId: string; quantity: number }>;
    reason?: string;
  }, userId: string) {
    const challan = await prisma.challan.findUnique({
      where: { id: data.challanId },
      include: { items: true, returns: { include: { items: true } } },
    });

    if (!challan) throw new NotFoundError('Challan', data.challanId);
    if (challan.status !== 'CONFIRMED' && challan.status !== 'INVOICED') {
      throw new ValidationError('Can only return items from confirmed or invoiced challans');
    }

    // Calculate already returned quantities
    const returnedQty = new Map<string, number>();
    for (const ret of challan.returns) {
      if (ret.status !== 'CANCELLED') {
        for (const item of ret.items) {
          returnedQty.set(item.productId, (returnedQty.get(item.productId) || 0) + item.quantity);
        }
      }
    }

    // Validate return quantities
    for (const returnItem of data.items) {
      const challanItem = challan.items.find(i => i.productId === returnItem.productId);
      if (!challanItem) throw new ValidationError(`Product ${returnItem.productId} not found in challan`);

      const alreadyReturned = returnedQty.get(returnItem.productId) || 0;
      const maxReturnable = challanItem.quantity - alreadyReturned;

      if (returnItem.quantity > maxReturnable) {
        throw new ValidationError(`Return quantity exceeds returnable amount`, {
          productId: returnItem.productId,
          soldQuantity: challanItem.quantity,
          alreadyReturned,
          maxReturnable,
          requested: returnItem.quantity,
        });
      }
    }

    const returnNumber = await this.generateReturnNumber();

    return await prisma.$transaction(async (tx) => {
      const salesReturn = await tx.salesReturn.create({
        data: {
          returnNumber,
          challanId: data.challanId,
          customerId: challan.customerId,
          reason: data.reason,
          status: 'APPROVED',
          approvedAt: new Date(),
          createdById: userId,
          items: {
            create: data.items.map(item => {
              const challanItem = challan.items.find(i => i.productId === item.productId)!;
              return {
                productId: item.productId,
                productNameSnapshot: challanItem.productNameSnapshot,
                skuSnapshot: challanItem.skuSnapshot,
                quantity: item.quantity,
                unitPriceSnapshot: challanItem.unitPriceSnapshot,
              };
            }),
          },
        },
        include: { items: true, customer: { select: { customerName: true } } },
      });

      // Restore inventory and create stock movements
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: 'IN',
            reason: 'SALES_RETURN',
            referenceType: 'SALES_RETURN',
            referenceId: salesReturn.id,
            createdById: userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'RETURN_CREATED',
          entityType: 'SALES_RETURN',
          entityId: salesReturn.id,
          newValues: {
            returnNumber,
            challanNumber: challan.challanNumber,
            itemCount: data.items.length,
          } as any,
        },
      });

      return salesReturn;
    });
  }
}

export const returnService = new ReturnService();
