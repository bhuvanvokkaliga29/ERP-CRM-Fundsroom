import { prisma } from '../../config/database';

export class IntelligenceService {
  /**
   * Customer Health Score (0-100)
   * Factors: recency, frequency, revenue, follow-up completion, cancellation rate
   */
  async getCustomerIntelligence(customerId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return null;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [orders, recentOrders, revenue, recentRevenue, followUps, cancelledChallans, lastPurchase] = await Promise.all([
      prisma.challan.count({ where: { customerId, status: { not: 'CANCELLED' } } }),
      prisma.challan.count({ where: { customerId, status: { not: 'CANCELLED' }, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.invoice.aggregate({ where: { customerId, status: { in: ['ISSUED', 'PAID'] } }, _sum: { grandTotal: true } }),
      prisma.invoice.aggregate({
        where: { customerId, status: { in: ['ISSUED', 'PAID'] }, createdAt: { gte: ninetyDaysAgo } },
        _sum: { grandTotal: true },
      }),
      prisma.customerFollowUp.groupBy({ by: ['status'], where: { customerId }, _count: true }),
      prisma.challan.count({ where: { customerId, status: 'CANCELLED' } }),
      prisma.challan.findFirst({
        where: { customerId, status: { in: ['CONFIRMED', 'INVOICED', 'COMPLETED'] } },
        orderBy: { confirmedAt: 'desc' },
        select: { confirmedAt: true },
      }),
    ]);

    // Calculate purchase intervals
    const confirmedChallans = await prisma.challan.findMany({
      where: { customerId, status: { in: ['CONFIRMED', 'INVOICED', 'COMPLETED'] } },
      orderBy: { confirmedAt: 'asc' },
      select: { confirmedAt: true },
    });

    let avgPurchaseInterval = 0;
    if (confirmedChallans.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < confirmedChallans.length; i++) {
        const diff = (confirmedChallans[i].confirmedAt!.getTime() - confirmedChallans[i - 1].confirmedAt!.getTime()) / (1000 * 60 * 60 * 24);
        intervals.push(diff);
      }
      avgPurchaseInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    const daysSinceLastPurchase = lastPurchase?.confirmedAt
      ? Math.floor((Date.now() - lastPurchase.confirmedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const totalFollowUps = followUps.reduce((sum, f) => sum + f._count, 0);
    const completedFollowUps = followUps.find(f => f.status === 'COMPLETED')?._count || 0;
    const overdueFollowUps = followUps.find(f => f.status === 'OVERDUE')?._count || 0;
    const followUpCompletionRate = totalFollowUps > 0 ? completedFollowUps / totalFollowUps : 0;
    const cancellationRate = (orders + cancelledChallans) > 0 ? cancelledChallans / (orders + cancelledChallans) : 0;

    // Score calculation
    const factors: Array<{ factor: string; score: number; weight: number; explanation: string }> = [];

    // Recency (25%)
    let recencyScore = 0;
    if (daysSinceLastPurchase === null) recencyScore = 10;
    else if (daysSinceLastPurchase <= 7) recencyScore = 100;
    else if (daysSinceLastPurchase <= 14) recencyScore = 85;
    else if (daysSinceLastPurchase <= 30) recencyScore = 70;
    else if (daysSinceLastPurchase <= 60) recencyScore = 45;
    else if (daysSinceLastPurchase <= 90) recencyScore = 25;
    else recencyScore = 10;

    factors.push({
      factor: 'Purchase Recency',
      score: recencyScore,
      weight: 0.25,
      explanation: daysSinceLastPurchase !== null
        ? `Last purchase ${daysSinceLastPurchase} days ago`
        : 'No purchase history',
    });

    // Frequency (20%)
    let frequencyScore = Math.min(100, recentOrders * 25);
    factors.push({
      factor: 'Purchase Frequency',
      score: frequencyScore,
      weight: 0.20,
      explanation: `${recentOrders} orders in last 30 days`,
    });

    // Revenue (25%)
    const totalRev = revenue._sum.grandTotal?.toNumber() || 0;
    let revenueScore = Math.min(100, (totalRev / 500000) * 100);
    factors.push({
      factor: 'Lifetime Revenue',
      score: Math.round(revenueScore),
      weight: 0.25,
      explanation: `₹${totalRev.toLocaleString('en-IN')} lifetime value`,
    });

    // Follow-up completion (15%)
    let followUpScore = followUpCompletionRate * 100;
    if (overdueFollowUps > 0) followUpScore = Math.max(0, followUpScore - overdueFollowUps * 15);
    factors.push({
      factor: 'Follow-up Engagement',
      score: Math.round(followUpScore),
      weight: 0.15,
      explanation: totalFollowUps > 0
        ? `${Math.round(followUpCompletionRate * 100)}% completion rate, ${overdueFollowUps} overdue`
        : 'No follow-up history',
    });

    // Cancellation (15%)
    let cancellationScore = Math.max(0, 100 - cancellationRate * 200);
    factors.push({
      factor: 'Order Consistency',
      score: Math.round(cancellationScore),
      weight: 0.15,
      explanation: cancellationRate > 0
        ? `${Math.round(cancellationRate * 100)}% cancellation rate`
        : 'No cancellations',
    });

    const healthScore = Math.round(
      factors.reduce((sum, f) => sum + f.score * f.weight, 0)
    );

    // Churn risk
    let churnRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    const churnReasons: string[] = [];

    if (daysSinceLastPurchase !== null) {
      if (avgPurchaseInterval > 0 && daysSinceLastPurchase > avgPurchaseInterval * 2.5) {
        churnRisk = 'HIGH';
        churnReasons.push(`No purchase for ${daysSinceLastPurchase} days (typical interval: ${Math.round(avgPurchaseInterval)} days)`);
      } else if (avgPurchaseInterval > 0 && daysSinceLastPurchase > avgPurchaseInterval * 1.5) {
        churnRisk = 'MEDIUM';
        churnReasons.push(`Purchase frequency declining`);
      }
    }

    if (overdueFollowUps >= 2) {
      churnRisk = churnRisk === 'LOW' ? 'MEDIUM' : 'HIGH';
      churnReasons.push(`${overdueFollowUps} follow-ups overdue`);
    }

    const recentRev = recentRevenue._sum.grandTotal?.toNumber() || 0;
    if (totalRev > 0 && recentRev < totalRev * 0.1) {
      churnRisk = churnRisk === 'LOW' ? 'MEDIUM' : 'HIGH';
      churnReasons.push('Recent revenue significantly below lifetime average');
    }

    if (churnReasons.length === 0) {
      churnReasons.push('No significant risk indicators detected');
    }

    // Lead priority (for LEAD customers)
    let leadPriority = null;
    if (customer.status === 'LEAD') {
      let priorityScore = 50;
      const priorityFactors: string[] = [];

      if (customer.businessName) { priorityScore += 10; priorityFactors.push('Business name provided'); }
      if (customer.gstNumber) { priorityScore += 15; priorityFactors.push('GST number available'); }
      if (customer.email) { priorityScore += 5; priorityFactors.push('Email provided'); }
      if (customer.customerType === 'WHOLESALE') { priorityScore += 10; priorityFactors.push('Wholesale customer type'); }
      if (customer.customerType === 'DISTRIBUTOR') { priorityScore += 15; priorityFactors.push('Distributor customer type'); }
      if (completedFollowUps > 0) { priorityScore += 10; priorityFactors.push('Engaged with follow-ups'); }
      if (overdueFollowUps > 0) { priorityScore -= 10; priorityFactors.push('Has overdue follow-ups'); }

      priorityScore = Math.min(100, Math.max(0, priorityScore));
      let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
      if (priorityScore >= 75) priority = 'HIGH';
      else if (priorityScore < 40) priority = 'LOW';

      leadPriority = { score: priorityScore, priority, factors: priorityFactors };
    }

    // AI Summary
    const summaryParts: string[] = [];
    summaryParts.push(`${customer.customerName}${customer.businessName ? ` (${customer.businessName})` : ''} is a ${customer.status.toLowerCase()} ${customer.customerType.toLowerCase()} customer.`);

    if (totalRev > 0) summaryParts.push(`Lifetime revenue of ₹${totalRev.toLocaleString('en-IN')} across ${orders} orders.`);
    if (daysSinceLastPurchase !== null) summaryParts.push(`Last purchase was ${daysSinceLastPurchase} days ago.`);
    if (overdueFollowUps > 0) summaryParts.push(`${overdueFollowUps} follow-up${overdueFollowUps > 1 ? 's are' : ' is'} overdue.`);
    if (churnRisk === 'HIGH') summaryParts.push('Customer shows elevated churn risk and may need attention.');

    return {
      healthScore,
      factors,
      churnRisk,
      churnReasons,
      leadPriority,
      summary: summaryParts.join(' '),
      metrics: {
        lifetimeRevenue: totalRev,
        recentRevenue: recentRev,
        totalOrders: orders,
        recentOrders,
        avgPurchaseInterval: Math.round(avgPurchaseInterval),
        daysSinceLastPurchase,
        followUpCompletionRate: Math.round(followUpCompletionRate * 100),
        overdueFollowUps,
        cancellationRate: Math.round(cancellationRate * 100),
      },
    };
  }

  /**
   * Inventory intelligence: velocity, stockout estimation, reorder recommendations
   */
  async getInventoryRecommendations() {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { category: { select: { name: true } }, warehouse: { select: { name: true } } },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recommendations = await Promise.all(products.map(async (product) => {
      const [sales30d, sales7d] = await Promise.all([
        prisma.stockMovement.aggregate({
          where: { productId: product.id, movementType: 'OUT', reason: 'SALES_CHALLAN', createdAt: { gte: thirtyDaysAgo } },
          _sum: { quantityChanged: true },
        }),
        prisma.stockMovement.aggregate({
          where: { productId: product.id, movementType: 'OUT', reason: 'SALES_CHALLAN', createdAt: { gte: sevenDaysAgo } },
          _sum: { quantityChanged: true },
        }),
      ]);

      const unitsSold30d = sales30d._sum.quantityChanged || 0;
      const unitsSold7d = sales7d._sum.quantityChanged || 0;
      const velocity30d = unitsSold30d / 30;
      const velocity7d = unitsSold7d / 7;
      const available = product.currentStock - product.reservedStock;
      const daysRemaining = velocity30d > 0 ? available / velocity30d : null;

      // Reorder calculation (lead time = 7 days assumed, safety stock = 3 days)
      const leadTimeDays = 7;
      const safetyDays = 3;
      const expectedDemand = velocity30d * (leadTimeDays + safetyDays);
      const recommendedQuantity = Math.max(0, Math.ceil(expectedDemand - available));

      let urgency: 'NORMAL' | 'ATTENTION' | 'HIGH' | 'CRITICAL' = 'NORMAL';
      if (daysRemaining !== null) {
        if (daysRemaining <= 3) urgency = 'CRITICAL';
        else if (daysRemaining <= 7) urgency = 'HIGH';
        else if (daysRemaining <= 14) urgency = 'ATTENTION';
      }
      if (product.currentStock === 0) urgency = 'CRITICAL';

      // Simple demand forecast (weighted moving average)
      const forecast = {
        method: 'Weighted Moving Average',
        dailyDemand30d: Math.round(velocity30d * 100) / 100,
        dailyDemand7d: Math.round(velocity7d * 100) / 100,
        projectedWeekly: Math.round(velocity30d * 7),
        projectedMonthly: Math.round(velocity30d * 30),
        note: unitsSold30d < 5 ? 'Limited sales data — forecast may be unreliable' : undefined,
      };

      return {
        productId: product.id,
        productName: product.productName,
        sku: product.sku,
        category: product.category.name,
        warehouse: product.warehouse.name,
        currentStock: product.currentStock,
        available,
        minimumStock: product.minimumStockAlertQuantity,
        salesVelocity: { daily30d: velocity30d, daily7d: velocity7d },
        daysRemaining: daysRemaining !== null ? Math.round(daysRemaining * 10) / 10 : null,
        reorder: recommendedQuantity > 0 ? {
          recommendedQuantity,
          urgency,
          reason: daysRemaining !== null && daysRemaining <= 7
            ? `Estimated stockout in ${Math.round(daysRemaining)} days at current sales velocity`
            : recommendedQuantity > 0
            ? 'Stock below safety threshold based on demand forecast'
            : undefined,
        } : null,
        forecast,
      };
    }));

    return recommendations
      .filter(r => r.reorder !== null || r.currentStock <= r.minimumStock)
      .sort((a, b) => {
        const urgencyOrder = { CRITICAL: 0, HIGH: 1, ATTENTION: 2, NORMAL: 3 };
        const aUrg = a.reorder?.urgency || 'NORMAL';
        const bUrg = b.reorder?.urgency || 'NORMAL';
        return urgencyOrder[aUrg] - urgencyOrder[bUrg];
      });
  }

  /**
   * Business Brief - concise management summary
   */
  async getBusinessBrief() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [currentRevenue, previousRevenue, confirmedChallans, lowStock, overdueFollowUps, activeLeads, recentAnomalies] = await Promise.all([
      prisma.invoice.aggregate({
        where: { status: { in: ['ISSUED', 'PAID'] }, createdAt: { gte: thirtyDaysAgo } },
        _sum: { grandTotal: true }, _count: true,
      }),
      prisma.invoice.aggregate({
        where: { status: { in: ['ISSUED', 'PAID'] }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        _sum: { grandTotal: true }, _count: true,
      }),
      prisma.challan.count({ where: { status: 'CONFIRMED', confirmedAt: { gte: thirtyDaysAgo } } }),
      prisma.$queryRaw<Array<{ id: string; productName: string; currentStock: number }>>`
        SELECT id, "productName", "currentStock" FROM products
        WHERE "currentStock" <= "minimumStockAlertQuantity" AND status = 'ACTIVE'
        ORDER BY "currentStock" ASC LIMIT 5
      `,
      prisma.customerFollowUp.count({ where: { status: { in: ['SCHEDULED', 'OVERDUE'] }, scheduledAt: { lt: today } } }),
      prisma.customer.count({ where: { status: 'LEAD' } }),
      prisma.anomaly.findMany({ where: { status: 'DETECTED' }, orderBy: { detectedAt: 'desc' }, take: 3 }),
    ]);

    const curRev = currentRevenue._sum.grandTotal?.toNumber() || 0;
    const prevRev = previousRevenue._sum.grandTotal?.toNumber() || 0;
    const revenueChange = prevRev > 0 ? ((curRev - prevRev) / prevRev * 100) : 0;

    const sections: Array<{ title: string; content: string; severity?: string }> = [];

    // Sales
    const revDir = revenueChange >= 0 ? 'increased' : 'decreased';
    sections.push({
      title: 'Sales',
      content: `Revenue ${revDir} ${Math.abs(Math.round(revenueChange))}% compared with the previous period (₹${curRev.toLocaleString('en-IN')} vs ₹${prevRev.toLocaleString('en-IN')}). ${confirmedChallans} challans confirmed in the last 30 days.`,
    });

    // Inventory
    if (lowStock.length > 0) {
      sections.push({
        title: 'Inventory',
        content: `${lowStock.length} product${lowStock.length > 1 ? 's' : ''} may require replenishment: ${lowStock.map(p => `${p.productName} (${p.currentStock} units)`).join(', ')}.`,
        severity: 'warning',
      });
    } else {
      sections.push({ title: 'Inventory', content: 'All products are adequately stocked.' });
    }

    // CRM
    const crmParts: string[] = [];
    if (overdueFollowUps > 0) crmParts.push(`${overdueFollowUps} follow-up${overdueFollowUps > 1 ? 's are' : ' is'} overdue`);
    if (activeLeads > 0) crmParts.push(`${activeLeads} active lead${activeLeads > 1 ? 's' : ''} in pipeline`);
    sections.push({
      title: 'CRM',
      content: crmParts.length > 0 ? crmParts.join('. ') + '.' : 'CRM activity is on track.',
      severity: overdueFollowUps > 3 ? 'warning' : undefined,
    });

    // Attention
    const attentionItems: string[] = [];
    if (lowStock.some(p => p.currentStock === 0)) attentionItems.push('One or more products are out of stock');
    if (overdueFollowUps > 5) attentionItems.push(`${overdueFollowUps} overdue follow-ups require immediate attention`);
    if (recentAnomalies.length > 0) attentionItems.push(`${recentAnomalies.length} anomal${recentAnomalies.length > 1 ? 'ies' : 'y'} detected recently`);

    if (attentionItems.length > 0) {
      sections.push({
        title: 'Attention Required',
        content: attentionItems.join('. ') + '.',
        severity: 'critical',
      });
    }

    return { sections, generatedAt: new Date().toISOString() };
  }

  /**
   * Next Best Actions - prioritized operational recommendations
   */
  async getNextActions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const actions: Array<{
      title: string; reason: string; priority: 'HIGH' | 'MEDIUM' | 'LOW';
      relatedEntity: { type: string; id?: string; name?: string };
      recommendedAction: string;
    }> = [];

    // Overdue follow-ups
    const overdueFollowUps = await prisma.customerFollowUp.findMany({
      where: { status: { in: ['SCHEDULED', 'OVERDUE'] }, scheduledAt: { lt: today } },
      include: { customer: { select: { id: true, customerName: true } } },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    });

    for (const fu of overdueFollowUps) {
      actions.push({
        title: `Contact ${fu.customer.customerName}`,
        reason: `Follow-up was scheduled for ${fu.scheduledAt.toLocaleDateString('en-IN')} and is now overdue`,
        priority: 'HIGH',
        relatedEntity: { type: 'CUSTOMER', id: fu.customer.id, name: fu.customer.customerName },
        recommendedAction: 'Complete overdue follow-up or reschedule',
      });
    }

    // Low stock products needing reorder
    const lowStockProducts = await prisma.$queryRaw<Array<{ id: string; productName: string; currentStock: number }>>`
      SELECT id, "productName", "currentStock" FROM products
      WHERE "currentStock" <= "minimumStockAlertQuantity" AND status = 'ACTIVE'
      ORDER BY "currentStock" ASC LIMIT 5
    `;

    for (const product of lowStockProducts) {
      actions.push({
        title: `Reorder ${product.productName}`,
        reason: `Current stock (${product.currentStock} units) is at or below minimum threshold`,
        priority: product.currentStock === 0 ? 'HIGH' : 'MEDIUM',
        relatedEntity: { type: 'PRODUCT', id: product.id, name: product.productName },
        recommendedAction: 'Review reorder recommendations and place purchase order',
      });
    }

    // Confirmed challans without invoices
    const uninvoicedChallans = await prisma.challan.findMany({
      where: { status: 'CONFIRMED', invoices: { none: {} } },
      include: { customer: { select: { customerName: true } } },
      orderBy: { confirmedAt: 'asc' },
      take: 5,
    });

    for (const challan of uninvoicedChallans) {
      actions.push({
        title: `Generate invoice for ${challan.challanNumber}`,
        reason: `Challan confirmed for ${challan.customer.customerName} but no invoice generated yet`,
        priority: 'MEDIUM',
        relatedEntity: { type: 'CHALLAN', id: challan.id, name: challan.challanNumber },
        recommendedAction: 'Generate invoice from confirmed challan',
      });
    }

    return actions.sort((a, b) => {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return order[a.priority] - order[b.priority];
    });
  }
}

export const intelligenceService = new IntelligenceService();
