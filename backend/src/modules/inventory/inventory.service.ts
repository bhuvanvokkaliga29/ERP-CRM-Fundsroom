import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export class InventoryService {
  async getInventory(params: {
    page: number; limit: number; skip: number;
    search?: string; categoryId?: string; warehouseId?: string;
    stockStatus?: string;
  }) {
    const where: Prisma.ProductWhereInput = { status: 'ACTIVE' };
    if (params.search) {
      where.OR = [
        { productName: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;

    if (params.stockStatus) {
      switch (params.stockStatus) {
        case 'HEALTHY': where.currentStock = { gt: prisma.$queryRaw`"minimumStockAlertQuantity"` as any }; break;
        case 'OUT_OF_STOCK': where.currentStock = 0; break;
        case 'CRITICAL': where.currentStock = { gt: 0, lte: 5 }; break;
        case 'LOW': where.AND = [
          { currentStock: { gt: 5 } },
          { currentStock: { lte: Prisma.raw('"minimumStockAlertQuantity"') as any } },
        ]; break;
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, orderBy: { currentStock: 'asc' },
        skip: params.skip, take: params.limit,
        include: {
          category: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate inventory status and sales velocity
    const enrichedProducts = await Promise.all(products.map(async (product) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const salesMovements = await prisma.stockMovement.aggregate({
        where: {
          productId: product.id,
          movementType: 'OUT',
          reason: 'SALES_CHALLAN',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { quantityChanged: true },
      });

      const unitsSold30d = salesMovements._sum.quantityChanged || 0;
      const salesVelocity = unitsSold30d / 30;
      const available = product.currentStock - product.reservedStock;

      let stockStatus: string;
      if (product.currentStock === 0) stockStatus = 'OUT_OF_STOCK';
      else if (product.currentStock <= 5) stockStatus = 'CRITICAL';
      else if (product.currentStock <= product.minimumStockAlertQuantity) stockStatus = 'LOW';
      else stockStatus = 'HEALTHY';

      return {
        ...product,
        available,
        stockStatus,
        salesVelocity: Math.round(salesVelocity * 100) / 100,
        daysRemaining: salesVelocity > 0 ? Math.round((available / salesVelocity) * 10) / 10 : null,
      };
    }));

    // Compute summary
    const allProducts = await prisma.product.groupBy({ by: ['currentStock', 'minimumStockAlertQuantity'], where: { status: 'ACTIVE' } });
    const outOfStock = allProducts.filter(p => p.currentStock === 0).length;
    const critical = allProducts.filter(p => p.currentStock > 0 && p.currentStock <= 5).length;
    const low = allProducts.filter(p => p.currentStock > 5 && p.currentStock <= p.minimumStockAlertQuantity).length;
    const totalCount = await prisma.product.count({ where: { status: 'ACTIVE' } });
    const totalValueAgg = await prisma.product.findMany({ where: { status: 'ACTIVE' }, select: { currentStock: true, unitPrice: true } });
    const totalValue = totalValueAgg.reduce((sum, p) => sum + (p.currentStock * Number(p.unitPrice)), 0);

    // Add avgDailySales alias
    const withAlias = enrichedProducts.map(p => ({ ...p, avgDailySales: p.salesVelocity }));

    return { products: withAlias, total, summary: { total: totalCount, outOfStock, critical, low, healthy: totalCount - outOfStock - critical - low, totalValue } };
  }

  async getLowStock() {
    const products = await prisma.$queryRaw<Array<any>>`
      SELECT p.id, p."productName", p.sku, p."currentStock", p."minimumStockAlertQuantity",
             c.name as "categoryName", w.name as "warehouseName"
      FROM products p
      JOIN categories c ON p."categoryId" = c.id
      JOIN warehouses w ON p."warehouseId" = w.id
      WHERE p."currentStock" <= p."minimumStockAlertQuantity"
      AND p.status = 'ACTIVE'
      ORDER BY p."currentStock" ASC
    `;
    return products;
  }

  async getStockMovements(params: {
    page: number; limit: number; skip: number;
    productId?: string; movementType?: string; reason?: string;
    dateFrom?: string; dateTo?: string;
  }) {
    const where: Prisma.StockMovementWhereInput = {};
    if (params.productId) where.productId = params.productId;
    if (params.movementType) where.movementType = params.movementType as any;
    if (params.reason) where.reason = params.reason as any;
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.createdAt.lte = new Date(params.dateTo);
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: params.skip, take: params.limit,
        include: {
          product: { select: { id: true, productName: true, sku: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return { movements, total };
  }
}

export const inventoryService = new InventoryService();
