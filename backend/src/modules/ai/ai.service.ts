import { prisma } from '../../config/database';
import { intelligenceService } from '../intelligence/intelligence.service';
import { analyticsService } from '../analytics/analytics.service';
import { AuthorizationError } from '../../utils/errors';

type Intent = 'LOW_STOCK' | 'STOCKOUT_RISK' | 'TOP_CUSTOMERS' | 'CUSTOMER_RISK' |
  'OVERDUE_FOLLOWUPS' | 'SALES_SUMMARY' | 'PRODUCT_PERFORMANCE' | 'BUSINESS_BRIEF' |
  'CUSTOMER_LOOKUP' | 'CHALLAN_LOOKUP' | 'REORDER_RECOMMENDATIONS' | 'UNKNOWN';

const INTENT_PATTERNS: Array<{ intent: Intent; patterns: RegExp[] }> = [
  { intent: 'LOW_STOCK', patterns: [/low.?stock/i, /need.?restock/i, /out.?of.?stock/i, /running.?low/i, /need.?attention.*product/i, /product.*need.*attention/i] },
  { intent: 'STOCKOUT_RISK', patterns: [/stockout/i, /run.?out/i, /how.?long.*stock/i, /stock.*last/i] },
  { intent: 'TOP_CUSTOMERS', patterns: [/top.?customer/i, /best.?customer/i, /highest.?value/i, /biggest.*customer/i] },
  { intent: 'CUSTOMER_RISK', patterns: [/risk/i, /churn/i, /at.?risk/i, /losing/i, /customer.*risk/i] },
  { intent: 'OVERDUE_FOLLOWUPS', patterns: [/overdue/i, /follow.?up.*today/i, /contact.*today/i, /pending.*follow/i, /who.*should.*contact/i] },
  { intent: 'SALES_SUMMARY', patterns: [/sales/i, /revenue/i, /performance/i, /summarize.*business/i, /business.*performance/i, /how.*doing/i, /this.?month/i, /this.?week/i] },
  { intent: 'PRODUCT_PERFORMANCE', patterns: [/product.*sell/i, /selling.*fast/i, /best.*product/i, /top.*product/i, /fast.*moving/i] },
  { intent: 'BUSINESS_BRIEF', patterns: [/brief/i, /overview/i, /summary/i, /what.*happening/i, /management/i, /report/i] },
  { intent: 'CUSTOMER_LOOKUP', patterns: [/customer.*named/i, /find.*customer/i, /lookup.*customer/i, /search.*customer/i] },
  { intent: 'CHALLAN_LOOKUP', patterns: [/challan/i, /order/i, /recent.*order/i] },
  { intent: 'REORDER_RECOMMENDATIONS', patterns: [/reorder/i, /replenish/i, /purchase.*order/i, /what.*order/i] },
];

// Role-based access control for copilot intents
const ROLE_ALLOWED_INTENTS: Record<string, Intent[]> = {
  ADMIN: ['LOW_STOCK', 'STOCKOUT_RISK', 'TOP_CUSTOMERS', 'CUSTOMER_RISK', 'OVERDUE_FOLLOWUPS', 'SALES_SUMMARY', 'PRODUCT_PERFORMANCE', 'BUSINESS_BRIEF', 'CUSTOMER_LOOKUP', 'CHALLAN_LOOKUP', 'REORDER_RECOMMENDATIONS'],
  SALES: ['TOP_CUSTOMERS', 'CUSTOMER_RISK', 'OVERDUE_FOLLOWUPS', 'SALES_SUMMARY', 'PRODUCT_PERFORMANCE', 'BUSINESS_BRIEF', 'CUSTOMER_LOOKUP', 'CHALLAN_LOOKUP'],
  WAREHOUSE: ['LOW_STOCK', 'STOCKOUT_RISK', 'PRODUCT_PERFORMANCE', 'REORDER_RECOMMENDATIONS', 'BUSINESS_BRIEF'],
  ACCOUNTS: ['TOP_CUSTOMERS', 'SALES_SUMMARY', 'BUSINESS_BRIEF', 'CUSTOMER_LOOKUP', 'CHALLAN_LOOKUP'],
};

export class AIService {
  classifyIntent(query: string): Intent {
    for (const { intent, patterns } of INTENT_PATTERNS) {
      if (patterns.some(p => p.test(query))) {
        return intent;
      }
    }
    return 'UNKNOWN';
  }

  async processQuery(query: string, userRole: string) {
    const intent = this.classifyIntent(query);

    if (intent === 'UNKNOWN') {
      return {
        intent: 'UNKNOWN',
        response: 'I can help you with inventory status, customer insights, sales performance, follow-ups, and business summaries. Try asking about low stock products, top customers, overdue follow-ups, or a business summary.',
        data: null,
      };
    }

    // RBAC check
    const allowed = ROLE_ALLOWED_INTENTS[userRole] || [];
    if (!allowed.includes(intent)) {
      return {
        intent,
        response: `This information is not available for your role. Please contact an administrator if you need access to this data.`,
        data: null,
      };
    }

    try {
      const result = await this.executeIntent(intent);
      return { intent, ...result };
    } catch (error) {
      return {
        intent,
        response: 'An error occurred while processing your request. The underlying data service may be temporarily unavailable.',
        data: null,
      };
    }
  }

  private async executeIntent(intent: Intent): Promise<{ response: string; data: any }> {
    switch (intent) {
      case 'LOW_STOCK': {
        const products = await prisma.$queryRaw<Array<any>>`
          SELECT "productName", sku, "currentStock", "minimumStockAlertQuantity"
          FROM products WHERE "currentStock" <= "minimumStockAlertQuantity" AND status = 'ACTIVE'
          ORDER BY "currentStock" ASC LIMIT 10
        `;
        if (products.length === 0) return { response: 'All products are adequately stocked. No items currently below their minimum threshold.', data: [] };
        const list = products.map(p => `${p.productName} (${p.sku}): ${p.currentStock} units remaining`).join('\n');
        return { response: `${products.length} product${products.length > 1 ? 's are' : ' is'} at or below minimum stock levels:\n\n${list}`, data: products };
      }

      case 'STOCKOUT_RISK': {
        const recommendations = await intelligenceService.getInventoryRecommendations();
        const critical = recommendations.filter(r => r.reorder?.urgency === 'CRITICAL' || r.reorder?.urgency === 'HIGH');
        if (critical.length === 0) return { response: 'No immediate stockout risks detected. All products have sufficient inventory based on current sales velocity.', data: [] };
        const list = critical.map(r => `${r.productName}: ~${r.daysRemaining} days remaining at current sales rate`).join('\n');
        return { response: `${critical.length} product${critical.length > 1 ? 's face' : ' faces'} potential stockout:\n\n${list}`, data: critical };
      }

      case 'TOP_CUSTOMERS': {
        const analytics = await analyticsService.getSalesAnalytics({});
        const customers = analytics.topCustomers;
        if (customers.length === 0) return { response: 'No customer revenue data available for the selected period.', data: [] };
        const list = customers.map((c, i) => `${i + 1}. ${c.name}: ₹${c.revenue.toLocaleString('en-IN')} (${c.orders} orders)`).join('\n');
        return { response: `Top customers by revenue (last 30 days):\n\n${list}`, data: customers };
      }

      case 'OVERDUE_FOLLOWUPS': {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const overdue = await prisma.customerFollowUp.findMany({
          where: { status: { in: ['SCHEDULED', 'OVERDUE'] }, scheduledAt: { lt: today } },
          include: { customer: { select: { customerName: true, businessName: true } }, assignedTo: { select: { name: true } } },
          orderBy: { scheduledAt: 'asc' }, take: 10,
        });
        if (overdue.length === 0) return { response: 'No overdue follow-ups. All scheduled follow-ups are on track.', data: [] };
        const list = overdue.map(f => `${f.customer.customerName}${f.customer.businessName ? ` (${f.customer.businessName})` : ''} — due ${f.scheduledAt.toLocaleDateString('en-IN')}, assigned to ${f.assignedTo.name}`).join('\n');
        return { response: `${overdue.length} overdue follow-up${overdue.length > 1 ? 's' : ''}:\n\n${list}`, data: overdue };
      }

      case 'SALES_SUMMARY': {
        const analytics = await analyticsService.getSalesAnalytics({});
        const { summary } = analytics;
        return {
          response: `Sales Summary (Last 30 Days):\n\nTotal Revenue: ₹${summary.totalRevenue.toLocaleString('en-IN')}\nTotal Orders: ${summary.totalOrders}\nAverage Order Value: ₹${Math.round(summary.averageOrderValue).toLocaleString('en-IN')}`,
          data: analytics,
        };
      }

      case 'PRODUCT_PERFORMANCE': {
        const analytics = await analyticsService.getSalesAnalytics({});
        const products = analytics.topProducts;
        if (products.length === 0) return { response: 'No product sales data available for the selected period.', data: [] };
        const list = products.map((p, i) => `${i + 1}. ${p.name} (${p.sku}): ${p.quantity} units sold, ₹${p.revenue.toLocaleString('en-IN')} revenue`).join('\n');
        return { response: `Top performing products (last 30 days):\n\n${list}`, data: products };
      }

      case 'BUSINESS_BRIEF': {
        const brief = await intelligenceService.getBusinessBrief();
        const response = brief.sections.map(s => `**${s.title}**\n${s.content}`).join('\n\n');
        return { response, data: brief };
      }

      case 'CUSTOMER_LOOKUP': {
        const customers = await prisma.customer.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, customerName: true, businessName: true, status: true, customerType: true } });
        const list = customers.map(c => `${c.customerName}${c.businessName ? ` (${c.businessName})` : ''} — ${c.status}, ${c.customerType}`).join('\n');
        return { response: `Recent customers:\n\n${list}`, data: customers };
      }

      case 'REORDER_RECOMMENDATIONS': {
        const recommendations = await intelligenceService.getInventoryRecommendations();
        if (recommendations.length === 0) return { response: 'No reorder recommendations at this time. Inventory levels are healthy.', data: [] };
        const list = recommendations.slice(0, 10).map(r => `${r.productName} (${r.sku}): Order ${r.reorder?.recommendedQuantity || 0} units — ${r.reorder?.urgency || 'NORMAL'} urgency`).join('\n');
        return { response: `Reorder recommendations:\n\n${list}`, data: recommendations.slice(0, 10) };
      }

      case 'CUSTOMER_RISK': {
        // Find customers with potential risk indicators
        const customers = await prisma.customer.findMany({
          where: { status: 'ACTIVE' },
          take: 20,
          select: { id: true, customerName: true, businessName: true },
        });

        const riskCustomers: Array<any> = [];
        for (const customer of customers.slice(0, 10)) {
          const intel = await intelligenceService.getCustomerIntelligence(customer.id);
          if (intel && intel.churnRisk !== 'LOW') {
            riskCustomers.push({
              ...customer,
              churnRisk: intel.churnRisk,
              healthScore: intel.healthScore,
              reasons: intel.churnReasons,
            });
          }
        }

        if (riskCustomers.length === 0) return { response: 'No customers currently showing elevated churn risk indicators.', data: [] };
        const list = riskCustomers.map(c => `${c.customerName}: ${c.churnRisk} risk (health: ${c.healthScore}/100) — ${c.reasons[0]}`).join('\n');
        return { response: `${riskCustomers.length} customer${riskCustomers.length > 1 ? 's' : ''} showing risk indicators:\n\n${list}`, data: riskCustomers };
      }

      default:
        return { response: 'I understand your question but cannot process it at this time.', data: null };
    }
  }

  async generateFollowUpDraft(customerId: string, mode: 'professional' | 'friendly' | 'short' = 'professional') {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return null;

    const lastChallan = await prisma.challan.findFirst({
      where: { customerId, status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' },
      include: { items: { take: 3 } },
    });

    const lastFollowUp = await prisma.customerFollowUp.findFirst({
      where: { customerId },
      orderBy: { scheduledAt: 'desc' },
    });

    const name = customer.customerName.split(' ')[0];
    const business = customer.businessName || '';

    let draft = '';

    switch (mode) {
      case 'professional':
        draft = `Dear ${customer.customerName},\n\nI hope this message finds you well.`;
        if (lastChallan) {
          draft += ` I wanted to follow up regarding your recent order${lastChallan.items.length > 0 ? ` including ${lastChallan.items[0].productNameSnapshot}` : ''}.`;
        }
        draft += ` We value our business relationship${business ? ` with ${business}` : ''} and would like to discuss how we can continue to support your needs.`;
        if (lastFollowUp?.note) draft += `\n\nRegarding our previous discussion: ${lastFollowUp.note}`;
        draft += `\n\nPlease let me know a convenient time to connect.\n\nBest regards`;
        break;
      case 'friendly':
        draft = `Hi ${name}! 👋\n\nJust checking in`;
        if (business) draft += ` to see how things are going at ${business}`;
        draft += `.`;
        if (lastChallan) draft += ` Hope you're happy with the recent order!`;
        draft += ` Would love to catch up and see if there's anything you need.\n\nLet me know when works for you!`;
        break;
      case 'short':
        draft = `Hi ${name},\n\nFollowing up`;
        if (lastChallan) draft += ` on your recent order`;
        draft += `. Would you have time for a quick call this week?`;
        break;
    }

    return {
      draft,
      mode,
      context: {
        customerName: customer.customerName,
        businessName: customer.businessName,
        lastOrder: lastChallan?.challanNumber || null,
        lastFollowUpNote: lastFollowUp?.note || null,
      },
    };
  }
}

export const aiService = new AIService();
