import { prisma } from '../../config/database';

export class DashboardService {
  async getDashboard(userRole: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // KPIs
    const [
      currentRevenue, previousRevenue,
      totalCustomers, activeCustomers, leadCustomers,
      confirmedChallans, draftChallans,
      lowStockProducts, totalProducts,
      overdueFollowUps, totalInvoices, invoiceRevenue,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { status: { in: ['ISSUED', 'PAID'] }, createdAt: { gte: thirtyDaysAgo } },
        _sum: { grandTotal: true },
      }),
      prisma.invoice.aggregate({
        where: { status: { in: ['ISSUED', 'PAID'] }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        _sum: { grandTotal: true },
      }),
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.customer.count({ where: { status: 'LEAD' } }),
      prisma.challan.count({ where: { status: 'CONFIRMED', createdAt: { gte: thirtyDaysAgo } } }),
      prisma.challan.count({ where: { status: 'DRAFT' } }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM products
        WHERE "currentStock" <= "minimumStockAlertQuantity" AND status = 'ACTIVE'
      `,
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.customerFollowUp.count({
        where: { status: { in: ['SCHEDULED', 'OVERDUE'] }, scheduledAt: { lt: today } },
      }),
      prisma.invoice.count({ where: { status: { in: ['ISSUED', 'PAID'] } } }),
      prisma.invoice.aggregate({
        where: { status: { in: ['ISSUED', 'PAID'] } },
        _sum: { grandTotal: true },
      }),
    ]);

    const currentRev = currentRevenue._sum.grandTotal?.toNumber() || 0;
    const previousRev = previousRevenue._sum.grandTotal?.toNumber() || 0;
    const revenueChange = previousRev > 0 ? ((currentRev - previousRev) / previousRev) * 100 : 0;

    // Inventory value
    const inventoryValue = await prisma.$queryRaw<[{ value: number }]>`
      SELECT COALESCE(SUM("currentStock" * "unitPrice"), 0) as value FROM products WHERE status = 'ACTIVE'
    `;

    // Average order value
    const avgOrder = await prisma.invoice.aggregate({
      where: { status: { in: ['ISSUED', 'PAID'] }, createdAt: { gte: thirtyDaysAgo } },
      _avg: { grandTotal: true },
    });

    // Revenue trend (last 30 days, grouped by date)
    const revenueTrend = await prisma.$queryRaw<Array<{ date: string; revenue: number; orders: number }>>`
      SELECT DATE(i."createdAt") as date,
             COALESCE(SUM(i."grandTotal"), 0) as revenue,
             COUNT(*)::int as orders
      FROM invoices i
      WHERE i.status IN ('ISSUED', 'PAID')
      AND i."createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE(i."createdAt")
      ORDER BY date ASC
    `;

    // Top products
    const topProducts = await prisma.$queryRaw<Array<{ name: string; revenue: number; quantity: number }>>`
      SELECT ci."productNameSnapshot" as name,
             SUM(ci."lineTotal")::float as revenue,
             SUM(ci.quantity)::int as quantity
      FROM challan_items ci
      JOIN challans c ON ci."challanId" = c.id
      WHERE c.status IN ('CONFIRMED', 'INVOICED', 'COMPLETED')
      AND c."createdAt" >= ${thirtyDaysAgo}
      GROUP BY ci."productNameSnapshot"
      ORDER BY revenue DESC
      LIMIT 5
    `;

    // Top customers
    const topCustomers = await prisma.$queryRaw<Array<{ name: string; revenue: number; orders: number }>>`
      SELECT cu."customerName" as name,
             SUM(i."grandTotal")::float as revenue,
             COUNT(*)::int as orders
      FROM invoices i
      JOIN customers cu ON i."customerId" = cu.id
      WHERE i.status IN ('ISSUED', 'PAID')
      AND i."createdAt" >= ${thirtyDaysAgo}
      GROUP BY cu."customerName"
      ORDER BY revenue DESC
      LIMIT 5
    `;

    // Customer distribution
    const customerDistribution = await prisma.customer.groupBy({
      by: ['status'],
      _count: true,
    });

    // Recent activity
    const recentActivity = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { id: true, name: true } } },
    });

    // Upcoming follow-ups
    const upcomingFollowUps = await prisma.customerFollowUp.findMany({
      where: {
        status: { in: ['SCHEDULED', 'OVERDUE'] },
        scheduledAt: { gte: today },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      include: {
        customer: { select: { id: true, customerName: true, businessName: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Recent challans
    const recentChallans = await prisma.challan.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: { select: { customerName: true } } }
    });

    // Overdue follow-ups (specifically overdue)
    const overdueFollowUpsList = await prisma.customerFollowUp.findMany({
      where: { status: 'OVERDUE' },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      include: { customer: { select: { customerName: true } } }
    });

    // Low stock alerts
    const lowStockAlerts = await prisma.$queryRaw<Array<{ id: string; productName: string; currentStock: number; minimumStockAlertQuantity: number }>>`
      SELECT id, "productName", "currentStock", "minimumStockAlertQuantity"
      FROM products
      WHERE "currentStock" <= "minimumStockAlertQuantity" AND status = 'ACTIVE'
      ORDER BY "currentStock" ASC
      LIMIT 5
    `;

    return {
      kpis: {
        revenue: { value: currentRev, change: Math.round(revenueChange * 10) / 10, period: '30d' },
        customers: { total: totalCustomers, active: activeCustomers, leads: leadCustomers },
        challans: { confirmed: confirmedChallans, draft: draftChallans },
        lowStockProducts: Number(lowStockProducts[0]?.count || 0),
        totalProducts,
        overdueFollowUps,
        invoices: totalInvoices,
        totalRevenue: invoiceRevenue._sum.grandTotal?.toNumber() || 0,
        inventoryValue: Number(inventoryValue[0]?.value || 0),
        averageOrderValue: avgOrder._avg.grandTotal?.toNumber() || 0,
      },
      charts: {
        revenueTrend,
        topProducts,
        topCustomers,
        customerDistribution: customerDistribution.map(d => ({
          status: d.status,
          count: d._count,
        })),
      },
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        userName: a.user.name,
        createdAt: a.createdAt,
        metadata: a.metadata,
      })),
      upcomingFollowUps,
      revenueTrend,
      topProducts,
      topCustomers,
      recentChallans,
      overdueFollowUps: overdueFollowUpsList,
      lowStockAlerts,
    };
  }
}

export const dashboardService = new DashboardService();
