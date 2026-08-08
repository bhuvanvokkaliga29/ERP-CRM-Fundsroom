import { prisma } from '../../config/database';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';
import { CreateProductInput, UpdateProductInput, AdjustStockInput } from './product.validator';
import { Prisma } from '@prisma/client';

export class ProductService {
  async findAll(params: {
    page: number;
    limit: number;
    skip: number;
    search?: string;
    categoryId?: string;
    warehouseId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: Prisma.ProductWhereInput = {};

    if (params.search) {
      where.OR = [
        { productName: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.status) where.status = params.status as any;

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (params.sortBy) {
      (orderBy as any)[params.sortBy] = params.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.limit,
        include: {
          category: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  async findById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        warehouse: true,
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { createdBy: { select: { id: true, name: true } } },
        },
      },
    });

    if (!product) throw new NotFoundError('Product', id);
    return product;
  }

  async create(data: CreateProductInput, userId: string) {
    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) {
      throw new ConflictError(`Product with SKU '${data.sku}' already exists`, 'DUPLICATE_SKU');
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          productName: data.productName,
          sku: data.sku,
          description: data.description,
          categoryId: data.categoryId,
          warehouseId: data.warehouseId,
          unitPrice: data.unitPrice,
          costPrice: data.costPrice,
          taxRate: data.taxRate,
          currentStock: data.currentStock,
          minimumStockAlertQuantity: data.minimumStockAlertQuantity,
          imageUrl: data.imageUrl,
          status: data.status,
        },
        include: {
          category: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
        },
      });

      // Create initial stock movement if stock > 0
      if (data.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            quantityChanged: data.currentStock,
            movementType: 'IN',
            reason: 'INITIAL_STOCK',
            referenceType: 'PRODUCT',
            referenceId: created.id,
            createdById: userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'PRODUCT_CREATED',
          entityType: 'PRODUCT',
          entityId: created.id,
          newValues: { productName: created.productName, sku: created.sku, unitPrice: data.unitPrice } as any,
        },
      });

      return created;
    });

    return product;
  }

  async update(id: string, data: UpdateProductInput, userId: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Product', id);

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PRODUCT_UPDATED',
        entityType: 'PRODUCT',
        entityId: id,
        oldValues: { productName: existing.productName, unitPrice: existing.unitPrice.toString() } as any,
        newValues: { productName: updated.productName, unitPrice: updated.unitPrice.toString() } as any,
      },
    });

    return updated;
  }

  async adjustStock(productId: string, data: AdjustStockInput, userId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError('Product', productId);

    const newStock = product.currentStock + data.quantity;
    if (newStock < 0) {
      throw new ValidationError('Stock adjustment would result in negative stock', {
        currentStock: product.currentStock,
        adjustment: data.quantity,
        resultingStock: newStock,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantityChanged: Math.abs(data.quantity),
          movementType: data.quantity > 0 ? 'IN' : 'OUT',
          reason: data.reason,
          note: data.note,
          referenceType: 'MANUAL',
          createdById: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'STOCK_ADJUSTED',
          entityType: 'PRODUCT',
          entityId: productId,
          oldValues: { currentStock: product.currentStock } as any,
          newValues: { currentStock: newStock, adjustment: data.quantity, reason: data.reason } as any,
        },
      });

      return { product: updated, movement };
    });

    return result;
  }

  async getMovements(productId: string, params: { page: number; limit: number; skip: number }) {
    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.limit,
        include: { createdBy: { select: { id: true, name: true } } },
      }),
      prisma.stockMovement.count({ where: { productId } }),
    ]);

    return { movements, total };
  }

  async getCategories() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async getWarehouses() {
    return prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
  }
}

export const productService = new ProductService();
