import { prisma } from '../../config/database';

export class AnalyticsService {
  async getSalesAnalytics(params: { dateFrom?: string; dateTo?: string }) {
    const dateFrom = params.dateFrom ? new Date(params.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = params.dateTo ? new Date(params.dateTo) : new Date();

    const [revenueByDate, topProducts, topCustomers, categorySales, totalMetrics] = await Promise.all([
      prisma.$queryRaw<Array<{ date: string; revenue: number; orders: number }>>`
        SELECT DATE(c."confirmedAt") as date,
               COALESCE(SUM(c."grandTotal"), 0)::float as revenue,
               COUNT(*)::int as orders
        FROM challans c
        WHERE c.status IN ('CONFIRMED', 'INVOICED', 'COMPLETED')
        AND c."confirmedAt" >= ${dateFrom} AND c."confirmedAt" <= ${dateTo}
        GROUP BY DATE(c."confirmedAt") ORDER BY date ASC
      `,
      prisma.$queryRaw<Array<{ name: string; sku: string; revenue: number; quantity: number }>>`
        SELECT ci."productNameSnapshot" as name, ci."skuSnapshot" as sku,
               SUM(ci."lineTotal")::float as revenue, SUM(ci.quantity)::int as quantity
        FROM challan_items ci JOIN challans c ON ci."challanId" = c.id
        WHERE c.status IN ('CONFIRMED', 'INVOICED', 'COMPLETED')
        AND c."confirmedAt" >= ${dateFrom} AND c."confirmedAt" <= ${dateTo}
        GROUP BY ci."productNameSnapshot", ci."skuSnapshot" ORDER BY revenue DESC LIMIT 10
      `,
      prisma.$queryRaw<Array<{ name: string; revenue: number; orders: number }>>`
        SELECT cu."customerName" as name,
               SUM(c."grandTotal")::float as revenue, COUNT(*)::int as orders
        FROM challans c JOIN customers cu ON c."customerId" = cu.id
        WHERE c.status IN ('CONFIRMED', 'INVOICED', 'COMPLETED')
        AND c."confirmedAt" >= ${dateFrom} AND c."confirmedAt" <= ${dateTo}
        GROUP BY cu."customerName" ORDER BY revenue DESC LIMIT 10
      `,
      prisma.$queryRaw<Array<{ category: string; revenue: number; quantity: number }>>`
        SELECT cat.name as category,
               SUM(ci."lineTotal")::float as revenue, SUM(ci.quantity)::int as quantity
        FROM challan_items ci
        JOIN challans c ON ci."challanId" = c.id
        JOIN products p ON ci."productId" = p.id
        JOIN categories cat ON p."categoryId" = cat.id
        WHERE c.status IN ('CONFIRMED', 'INVOICED', 'COMPLETED')
        AND c."confirmedAt" >= ${dateFrom} AND c."confirmedAt" <= ${dateTo}
        GROUP BY cat.name ORDER BY revenue DESC
      `,
      prisma.challan.aggregate({
        where: {
          status: { in: ['CONFIRMED', 'INVOICED', 'COMPLETED'] },
          confirmedAt: { gte: dateFrom, lte: dateTo },
        },
        _sum: { grandTotal: true },
        _count: true,
        _avg: { grandTotal: true },
      }),
    ]);

    return {
      revenueByDate,
      topProducts,
      topCustomers,
      categorySales,
      summary: {
        totalRevenue: totalMetrics._sum.grandTotal?.toNumber() || 0,
        totalOrders: totalMetrics._count,
        averageOrderValue: totalMetrics._avg.grandTotal?.toNumber() || 0,
      },
    };
  }

  async getCustomerAnalytics() {
    const [statusDist, typeDist, followUpStats] = await Promise.all([
      prisma.customer.groupBy({ by: ['status'], _count: true }),
      prisma.customer.groupBy({ by: ['customerType'], _count: true }),
      prisma.customerFollowUp.groupBy({ by: ['status'], _count: true }),
    ]);

    return {
      statusDistribution: statusDist.map(d => ({ status: d.status, count: d._count })),
      typeDistribution: typeDist.map(d => ({ type: d.customerType, count: d._count })),
      followUpStats: followUpStats.map(d => ({ status: d.status, count: d._count })),
    };
  }

  async getInventoryAnalytics() {
    const [totalValue, stockStatus, movementTrend] = await Promise.all([
      prisma.$queryRaw<[{ value: number; cost: number }]>`
        SELECT COALESCE(SUM("currentStock" * "unitPrice"), 0)::float as value,
               COALESCE(SUM("currentStock" * COALESCE("costPrice", "unitPrice")), 0)::float as cost
        FROM products WHERE status = 'ACTIVE'
      `,
      prisma.$queryRaw<Array<{ status: string; count: number }>>`
        SELECT CASE
          WHEN "currentStock" = 0 THEN 'OUT_OF_STOCK'
          WHEN "currentStock" <= 5 THEN 'CRITICAL'
          WHEN "currentStock" <= "minimumStockAlertQuantity" THEN 'LOW'
          ELSE 'HEALTHY'
        END as status, COUNT(*)::int as count
        FROM products WHERE status = 'ACTIVE'
        GROUP BY CASE
          WHEN "currentStock" = 0 THEN 'OUT_OF_STOCK'
          WHEN "currentStock" <= 5 THEN 'CRITICAL'
          WHEN "currentStock" <= "minimumStockAlertQuantity" THEN 'LOW'
          ELSE 'HEALTHY'
        END
      `,
      prisma.$queryRaw<Array<{ date: string; inQty: number; outQty: number }>>`
        SELECT DATE("createdAt") as date,
               SUM(CASE WHEN "movementType" = 'IN' THEN "quantityChanged" ELSE 0 END)::int as "inQty",
               SUM(CASE WHEN "movementType" = 'OUT' THEN "quantityChanged" ELSE 0 END)::int as "outQty"
        FROM stock_movements
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY DATE("createdAt") ORDER BY date ASC
      `,
    ]);

    return {
      inventoryValue: totalValue[0]?.value || 0,
      inventoryCost: totalValue[0]?.cost || 0,
      stockStatusDistribution: stockStatus,
      movementTrend,
    };
  }
}

export const analyticsService = new AnalyticsService();
