import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomDecimal(min: number, max: number, dp = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dp));
}
function daysAgo(d: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt;
}
function addDays(dt: Date, d: number) {
  const r = new Date(dt);
  r.setDate(r.getDate() + d);
  return r;
}

async function main() {
  console.log('🌱 Start seeding Ledger ERP...');

  // ─── 1. USERS ─────────────────────────────────────────────────────────────
  const pw = await bcrypt.hash('password123', 12);

  const [admin, sales, warehouse, accounts] = await Promise.all([
    upsertUser({ name: 'Super Admin', email: 'admin@ledger.test', role: 'ADMIN', pw }),
    upsertUser({ name: 'Priya Sales', email: 'sales@ledger.test', role: 'SALES', pw }),
    upsertUser({ name: 'Rajan Warehouse', email: 'warehouse@ledger.test', role: 'WAREHOUSE', pw }),
    upsertUser({ name: 'Meena Accounts', email: 'accounts@ledger.test', role: 'ACCOUNTS', pw }),
  ]);
  console.log('✅ Users created');

  // ─── 2. CATEGORIES ────────────────────────────────────────────────────────
  const categories = await Promise.all([
    upsertCategory('Electronics'),
    upsertCategory('Office Supplies'),
    upsertCategory('Industrial Equipment'),
    upsertCategory('Raw Materials'),
    upsertCategory('Packaging'),
  ]);
  const [catElec, catOffice, catIndustrial, catRaw, catPack] = categories;
  console.log('✅ Categories created');

  // ─── 3. WAREHOUSES ────────────────────────────────────────────────────────
  const [wh1, wh2, wh3] = await Promise.all([
    upsertWarehouse('Main Depot', 'Industrial Area, Block A, Bengaluru'),
    upsertWarehouse('North Store', 'Peenya Industrial Estate, Bengaluru'),
    upsertWarehouse('South Hub', 'Bommasandra Industrial Area, Bengaluru'),
  ]);
  console.log('✅ Warehouses created');

  // ─── 4. PRODUCTS ──────────────────────────────────────────────────────────
  const products = await Promise.all([
    // Electronics
    upsertProduct({ sku: 'ELEC-001', name: 'Logitech Wireless Keyboard', cat: catElec.id, wh: wh1.id, unit: 2200, cost: 1200, tax: 18, stock: 85, minStock: 20 }),
    upsertProduct({ sku: 'ELEC-002', name: 'Logitech Wireless Mouse', cat: catElec.id, wh: wh1.id, unit: 1500, cost: 800, tax: 18, stock: 120, minStock: 30 }),
    upsertProduct({ sku: 'ELEC-003', name: '24" LED Monitor Full HD', cat: catElec.id, wh: wh1.id, unit: 12500, cost: 8000, tax: 18, stock: 32, minStock: 10 }),
    upsertProduct({ sku: 'ELEC-004', name: 'USB-C Hub 7-in-1', cat: catElec.id, wh: wh2.id, unit: 1800, cost: 900, tax: 18, stock: 8, minStock: 15 }), // LOW STOCK
    upsertProduct({ sku: 'ELEC-005', name: 'HP LaserJet Printer', cat: catElec.id, wh: wh1.id, unit: 18000, cost: 12000, tax: 18, stock: 14, minStock: 5 }),
    upsertProduct({ sku: 'ELEC-006', name: 'Webcam 1080p HD', cat: catElec.id, wh: wh2.id, unit: 2800, cost: 1400, tax: 18, stock: 0, minStock: 10 }), // OUT OF STOCK
    upsertProduct({ sku: 'ELEC-007', name: 'Power Strip 6-Outlet', cat: catElec.id, wh: wh1.id, unit: 650, cost: 300, tax: 18, stock: 200, minStock: 50 }),
    upsertProduct({ sku: 'ELEC-008', name: 'UPS 600VA', cat: catElec.id, wh: wh1.id, unit: 4200, cost: 2800, tax: 18, stock: 28, minStock: 8 }),

    // Office Supplies
    upsertProduct({ sku: 'OFF-001', name: 'A4 Paper Ream 500 sheets', cat: catOffice.id, wh: wh1.id, unit: 350, cost: 200, tax: 12, stock: 500, minStock: 100 }),
    upsertProduct({ sku: 'OFF-002', name: 'Ballpoint Pens (Box 50)', cat: catOffice.id, wh: wh1.id, unit: 180, cost: 80, tax: 12, stock: 300, minStock: 80 }),
    upsertProduct({ sku: 'OFF-003', name: 'Stapler Heavy Duty', cat: catOffice.id, wh: wh2.id, unit: 420, cost: 200, tax: 12, stock: 75, minStock: 20 }),
    upsertProduct({ sku: 'OFF-004', name: 'File Cabinet 4-Drawer', cat: catOffice.id, wh: wh3.id, unit: 8500, cost: 5500, tax: 18, stock: 4, minStock: 5 }), // CRITICAL
    upsertProduct({ sku: 'OFF-005', name: 'Whiteboard 4x3 ft', cat: catOffice.id, wh: wh2.id, unit: 3200, cost: 1800, tax: 18, stock: 22, minStock: 5 }),

    // Industrial
    upsertProduct({ sku: 'IND-001', name: 'Safety Helmet ISI Marked', cat: catIndustrial.id, wh: wh3.id, unit: 450, cost: 200, tax: 18, stock: 150, minStock: 50 }),
    upsertProduct({ sku: 'IND-002', name: 'Industrial Gloves (Pair)', cat: catIndustrial.id, wh: wh3.id, unit: 120, cost: 55, tax: 18, stock: 400, minStock: 100 }),
    upsertProduct({ sku: 'IND-003', name: 'Fire Extinguisher 5kg', cat: catIndustrial.id, wh: wh3.id, unit: 2200, cost: 1300, tax: 18, stock: 45, minStock: 15 }),
    upsertProduct({ sku: 'IND-004', name: 'Portable Electric Drill', cat: catIndustrial.id, wh: wh3.id, unit: 3800, cost: 2200, tax: 18, stock: 18, minStock: 5 }),
    upsertProduct({ sku: 'IND-005', name: 'Extension Cord 20m', cat: catIndustrial.id, wh: wh2.id, unit: 800, cost: 420, tax: 18, stock: 3, minStock: 10 }), // CRITICAL

    // Raw Materials
    upsertProduct({ sku: 'RAW-001', name: 'Copper Wire 1.5mm (100m)', cat: catRaw.id, wh: wh2.id, unit: 1200, cost: 800, tax: 18, stock: 180, minStock: 50 }),
    upsertProduct({ sku: 'RAW-002', name: 'Aluminum Sheet 1mm (1sqm)', cat: catRaw.id, wh: wh3.id, unit: 850, cost: 550, tax: 18, stock: 90, minStock: 30 }),
    upsertProduct({ sku: 'RAW-003', name: 'PVC Pipe 25mm (6m)', cat: catRaw.id, wh: wh3.id, unit: 320, cost: 180, tax: 18, stock: 250, minStock: 60 }),

    // Packaging
    upsertProduct({ sku: 'PACK-001', name: 'Bubble Wrap Roll 50m', cat: catPack.id, wh: wh1.id, unit: 480, cost: 280, tax: 12, stock: 120, minStock: 30 }),
    upsertProduct({ sku: 'PACK-002', name: 'Cardboard Boxes (Pack 25)', cat: catPack.id, wh: wh1.id, unit: 650, cost: 350, tax: 12, stock: 200, minStock: 50 }),
    upsertProduct({ sku: 'PACK-003', name: 'Packing Tape 48mm (6 rolls)', cat: catPack.id, wh: wh2.id, unit: 220, cost: 110, tax: 12, stock: 350, minStock: 80 }),
    upsertProduct({ sku: 'PACK-004', name: 'Stretch Wrap Film 500m', cat: catPack.id, wh: wh1.id, unit: 890, cost: 500, tax: 12, stock: 7, minStock: 20 }), // LOW STOCK
  ]);
  console.log(`✅ ${products.length} Products created`);

  // Create initial stock movements for all products
  for (const p of products) {
    await prisma.stockMovement.upsert({
      where: { id: `init-${p.id}` },
      update: {},
      create: {
        id: `init-${p.id}`,
        productId: p.id,
        quantityChanged: p.currentStock,
        movementType: 'IN',
        reason: 'INITIAL_STOCK',
        note: 'Initial stock entry',
        createdById: admin.id,
        createdAt: daysAgo(180),
      },
    });
  }

  // ─── 5. CUSTOMERS (40) ─────────────────────────────────────────────────────
  const customerData = [
    // ACTIVE WHOLESALE - High Value
    { name: 'Ramesh Traders', biz: 'Ramesh Trading Corporation', email: 'ramesh@traders.co.in', mobile: '+919876543210', gst: '29AABCR1234A1Z5', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '42, MG Road, Bengaluru' },
    { name: 'ABC Enterprises', biz: 'ABC Enterprises Pvt Ltd', email: 'contact@abcent.com', mobile: '+919876543211', gst: '29AABCA5678B2Z6', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '17, Brigade Road, Bengaluru' },
    { name: 'Suresh Kumar & Sons', biz: 'SK Sons Distributors', email: 'sk@sons.co.in', mobile: '+919876543212', gst: '29AABCS9012C3Z7', type: 'DISTRIBUTOR' as const, status: 'ACTIVE' as const, addr: '8, Commercial Street, Bengaluru' },
    { name: 'Mahalakshmi Stores', biz: 'Mahalakshmi Trading Co', email: 'info@mahalakshmi.in', mobile: '+919876543213', gst: '29AABCM3456D4Z8', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '5, Chickpet, Bengaluru' },
    { name: 'Global Tech Solutions', biz: 'Global Tech Solutions LLP', email: 'gts@globaltech.com', mobile: '+919876543214', gst: '29AABCG7890E5Z9', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '200, Outer Ring Road, Bengaluru' },
    { name: 'Vijay Electronics Hub', biz: 'Vijay Electronics Hub', email: 'vijay@electronics.in', mobile: '+919876543215', gst: '29AABCV2345F6Z0', type: 'RETAIL' as const, status: 'ACTIVE' as const, addr: '56, SP Road, Bengaluru' },
    { name: 'Northern Supplies Co', biz: 'Northern Supplies Co', email: 'north@supplies.co.in', mobile: '+919876543216', gst: '29AABCN6789G7Z1', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '12, Hebbal, Bengaluru' },
    { name: 'Deccan Distributors', biz: 'Deccan Distributors Pvt Ltd', email: 'deccan@dist.com', mobile: '+919876543217', gst: '29AABCD1234H8Z2', type: 'DISTRIBUTOR' as const, status: 'ACTIVE' as const, addr: '78, Yeshwanthpur, Bengaluru' },
    { name: 'Shree Ganesh Traders', biz: 'Shree Ganesh Trading', email: 'shree@ganesh.in', mobile: '+919876543218', gst: '29AABCS5678I9Z3', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '33, Rajajinagar, Bengaluru' },
    { name: 'Metro Office Needs', biz: 'Metro Office Needs', email: 'metro@office.in', mobile: '+919876543219', gst: '29AABCM9012J0Z4', type: 'RETAIL' as const, status: 'ACTIVE' as const, addr: '9, Indiranagar, Bengaluru' },

    // ACTIVE RETAIL
    { name: 'Prathap Agencies', biz: 'Prathap & Co Agencies', email: 'prathap@agencies.com', mobile: '+919876543220', gst: '29AABCP3456K1Z5', type: 'RETAIL' as const, status: 'ACTIVE' as const, addr: '24, Malleshwaram, Bengaluru' },
    { name: 'Sunrise Stationery', biz: 'Sunrise Stationery Mart', email: 'sunrise@stat.in', mobile: '+919876543221', gst: null, type: 'RETAIL' as const, status: 'ACTIVE' as const, addr: '15, Koramangala, Bengaluru' },
    { name: 'Fast Track Logistics', biz: 'Fast Track Logistics Pvt Ltd', email: 'ftl@fasttrack.com', mobile: '+919876543222', gst: '29AABCF7890L2Z6', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '66, Electronic City, Bengaluru' },
    { name: 'Kumar Constructions', biz: 'Kumar Constructions Ltd', email: 'kumar@constructions.co.in', mobile: '+919876543223', gst: '29AABCK2345M3Z7', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '101, Whitefield, Bengaluru' },
    { name: 'Infosys Procurement', biz: 'Infosys Vendor Account', email: 'proc@infosys.co.in', mobile: '+919876543224', gst: '29AABCI6789N4Z8', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: 'Infosys Campus, Electronics City, Bengaluru' },

    // LEADS
    { name: 'Raj Pharma', biz: 'Raj Pharmaceutical Distributors', email: 'raj@pharma.in', mobile: '+919876543225', gst: null, type: 'WHOLESALE' as const, status: 'LEAD' as const, addr: '45, Tumkur Road, Bengaluru' },
    { name: 'Greenfield Industries', biz: 'Greenfield Industries', email: 'green@field.co.in', mobile: '+919876543226', gst: '29AABCG1234O5Z9', type: 'WHOLESALE' as const, status: 'LEAD' as const, addr: '22, Peenya, Bengaluru' },
    { name: 'TechPark Supplies', biz: 'TechPark Office Supplies', email: 'tp@techpark.in', mobile: '+919876543227', gst: null, type: 'RETAIL' as const, status: 'LEAD' as const, addr: 'ITPL, Whitefield, Bengaluru' },
    { name: 'Allied Services', biz: 'Allied Business Services', email: 'allied@services.com', mobile: '+919876543228', gst: null, type: 'RETAIL' as const, status: 'LEAD' as const, addr: '7, Cunningham Road, Bengaluru' },
    { name: 'Horizon Builders', biz: 'Horizon Builders & Contractors', email: 'horizon@build.co.in', mobile: '+919876543229', gst: '29AABCH5678P6Z0', type: 'WHOLESALE' as const, status: 'LEAD' as const, addr: '88, Mysore Road, Bengaluru' },
    { name: 'Sunrise Hotels Group', biz: 'Sunrise Hotels & Hospitality', email: 'proc@sunrisehotels.in', mobile: '+919876543230', gst: '29AABCS9012Q7Z1', type: 'WHOLESALE' as const, status: 'LEAD' as const, addr: '200, MG Road, Bengaluru' },
    { name: 'Omega Retail Chain', biz: 'Omega Retail Pvt Ltd', email: 'omega@retail.com', mobile: '+919876543231', gst: '29AABCO3456R8Z2', type: 'DISTRIBUTOR' as const, status: 'LEAD' as const, addr: '34, Sarjapur Road, Bengaluru' },

    // INACTIVE / DECLINING
    { name: 'Old Merchants Co', biz: 'Old Merchants Trading Company', email: 'old@merchants.in', mobile: '+919876543232', gst: '29AABCO7890S9Z3', type: 'WHOLESALE' as const, status: 'INACTIVE' as const, addr: '11, Chickpet Old Area, Bengaluru' },
    { name: 'Heritage Suppliers', biz: 'Heritage Suppliers', email: 'heritage@supp.in', mobile: '+919876543233', gst: null, type: 'RETAIL' as const, status: 'INACTIVE' as const, addr: '3, Basavanagudi, Bengaluru' },
    { name: 'Classic Retail', biz: 'Classic Retail Store', email: 'classic@retail.co.in', mobile: '+919876543234', gst: null, type: 'RETAIL' as const, status: 'INACTIVE' as const, addr: '19, Jayanagar, Bengaluru' },

    // More ACTIVE customers
    { name: 'Anil Kumar Trading', biz: 'AK Trading Corporation', email: 'anil@aktrading.in', mobile: '+919876543235', gst: '29AABCA2345T0Z4', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '55, Kengeri, Bengaluru' },
    { name: 'Techno Systems', biz: 'Techno Systems Pvt Ltd', email: 'ts@techno.com', mobile: '+919876543236', gst: '29AABCT6789U1Z5', type: 'RETAIL' as const, status: 'ACTIVE' as const, addr: '120, HSR Layout, Bengaluru' },
    { name: 'Premier Packaging', biz: 'Premier Packaging Solutions', email: 'premier@pack.in', mobile: '+919876543237', gst: '29AABCP1234V2Z6', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '44, Bannerghatta Road, Bengaluru' },
    { name: 'Excel Enterprises', biz: 'Excel Enterprises & Co', email: 'excel@ent.co.in', mobile: '+919876543238', gst: '29AABCE5678W3Z7', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '67, Domlur, Bengaluru' },
    { name: 'Sri Balaji Traders', biz: 'Sri Balaji Trading House', email: 'balaji@traders.in', mobile: '+919876543239', gst: '29AABCS9012X4Z8', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '29, BTM Layout, Bengaluru' },
    { name: 'Nirmala Distributors', biz: 'Nirmala Distribution Network', email: 'nirmala@dist.co.in', mobile: '+919876543240', gst: '29AABCN3456Y5Z9', type: 'DISTRIBUTOR' as const, status: 'ACTIVE' as const, addr: '88, Vijayanagar, Bengaluru' },
    { name: 'Ashoka Industries', biz: 'Ashoka Industrial Supplies', email: 'ashoka@ind.in', mobile: '+919876543241', gst: '29AABCA7890Z6Z0', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '14, Bommanahalli, Bengaluru' },
    { name: 'Pioneer Traders', biz: 'Pioneer Trading House', email: 'pioneer@trade.co.in', mobile: '+919876543242', gst: '29AABCP2345A7Z1', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '38, Wilson Garden, Bengaluru' },
    { name: 'Star Office Solutions', biz: 'Star Office Solutions', email: 'star@office.in', mobile: '+919876543243', gst: null, type: 'RETAIL' as const, status: 'ACTIVE' as const, addr: '52, Richmond Road, Bengaluru' },
    { name: 'Lakshmi Traders', biz: 'Lakshmi Trading Syndicate', email: 'lakshmi@trading.in', mobile: '+919876543244', gst: '29AABCL6789B8Z2', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '77, KR Market, Bengaluru' },
    { name: 'JB Supplies', biz: 'JB General Supplies', email: 'jb@supplies.in', mobile: '+919876543245', gst: null, type: 'RETAIL' as const, status: 'ACTIVE' as const, addr: '4, Ulsoor, Bengaluru' },
    { name: 'Cosmos Equipments', biz: 'Cosmos Equipment Solutions', email: 'cosmos@equip.com', mobile: '+919876543246', gst: '29AABCC1234C9Z3', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '92, Kanakpura Road, Bengaluru' },
    { name: 'Bharat Industrial', biz: 'Bharat Industrial Suppliers', email: 'bharat@ind.co.in', mobile: '+919876543247', gst: '29AABCB5678D0Z4', type: 'DISTRIBUTOR' as const, status: 'ACTIVE' as const, addr: '31, Tumkur Road, Bengaluru' },
    { name: 'Zenith Procurement', biz: 'Zenith Procurement Services', email: 'zenith@proc.in', mobile: '+919876543248', gst: '29AABCZ9012E1Z5', type: 'WHOLESALE' as const, status: 'ACTIVE' as const, addr: '115, Marathahalli, Bengaluru' },
    { name: 'Metro Distributors', biz: 'Metro Distribution House', email: 'metro@dist.in', mobile: '+919876543249', gst: '29AABCM3456F2Z6', type: 'DISTRIBUTOR' as const, status: 'ACTIVE' as const, addr: '23, KR Puram, Bengaluru' },
  ];

  const customers = await Promise.all(customerData.map(c => upsertCustomer(c)));
  console.log(`✅ ${customers.length} Customers created`);

  // ─── 6. CHALLANS + INVOICES (6 months history) ────────────────────────────
  const challanStates: { challan: any; invoice: any }[] = [];

  // Use first 15 active customers for sales history
  const activeCustomers = customers.filter(c => c.status === 'ACTIVE');
  const salesProds = products.filter(p => p.currentStock > 0 || p.sku.startsWith('ELEC') || p.sku.startsWith('OFF'));

  let challanCounter = 1;
  let invoiceCounter = 1;

  // Generate historical challans over 6 months
  for (let week = 24; week >= 0; week--) {
    const ordersThisWeek = randomBetween(2, 6);
    for (let o = 0; o < ordersThisWeek; o++) {
      const customer = activeCustomers[randomBetween(0, Math.min(12, activeCustomers.length - 1))];
      const numItems = randomBetween(1, 4);
      const selectedProds = shuffleArray([...salesProds]).slice(0, numItems);
      const createdAt = addDays(daysAgo(week * 7), randomBetween(0, 6));
      const challanNum = `CH-2026-${(challanCounter++).toString().padStart(6, '0')}`;

      const itemsData: any[] = [];
      let sub = new Prisma.Decimal(0);
      let taxT = new Prisma.Decimal(0);

      for (const p of selectedProds) {
        const qty = randomBetween(1, 10);
        const lSub = p.unitPrice.mul(qty);
        const lTax = lSub.mul(p.taxRate).div(100);
        sub = sub.add(lSub);
        taxT = taxT.add(lTax);
        itemsData.push({
          productId: p.id,
          productNameSnapshot: p.productName,
          skuSnapshot: p.sku,
          unitPriceSnapshot: p.unitPrice,
          taxRateSnapshot: p.taxRate,
          quantity: qty,
          lineSubtotal: lSub,
          lineTax: lTax,
          lineTotal: lSub.add(lTax),
        });
      }
      const grandTotal = sub.add(taxT);

      // Older challans are CONFIRMED or INVOICED, recent ones might be DRAFT
      const status = week > 1 ? 'CONFIRMED' : (week === 1 ? (randomBetween(0, 1) === 0 ? 'CONFIRMED' : 'DRAFT') : 'DRAFT');
      const confirmedAt = status !== 'DRAFT' ? addDays(createdAt, randomBetween(0, 2)) : undefined;

      const challan = await prisma.challan.upsert({
        where: { challanNumber: challanNum },
        update: {},
        create: {
          challanNumber: challanNum,
          customerId: customer.id,
          subtotal: sub,
          taxTotal: taxT,
          grandTotal,
          status,
          confirmedAt: confirmedAt ?? null,
          createdById: sales.id,
          createdAt,
          updatedAt: confirmedAt ?? createdAt,
          items: { create: itemsData },
        },
      });

      // Create stock movements for confirmed challans
      if (status === 'CONFIRMED') {
        for (const item of itemsData) {
          await prisma.stockMovement.upsert({
            where: { id: `sm-${challan.id}-${item.productId}` },
            update: {},
            create: {
              id: `sm-${challan.id}-${item.productId}`,
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: 'SALES_CHALLAN',
              referenceType: 'CHALLAN',
              referenceId: challan.id,
              createdById: sales.id,
              createdAt: confirmedAt ?? createdAt,
            },
          });
        }

        // Create invoice for most confirmed challans (80%)
        if (Math.random() > 0.2) {
          const invoiceNum = `INV-2026-${(invoiceCounter++).toString().padStart(6, '0')}`;
          const invStatus = week > 4 ? (Math.random() > 0.3 ? 'PAID' : 'ISSUED') : 'ISSUED';
          const issuedAt = addDays(confirmedAt!, randomBetween(0, 3));

          const existingInv = await prisma.invoice.findFirst({ where: { challanId: challan.id } });
          if (!existingInv) {
            const inv = await prisma.invoice.create({
              data: {
                invoiceNumber: invoiceNum,
                challanId: challan.id,
                customerId: customer.id,
                subtotal: sub,
                taxTotal: taxT,
                grandTotal,
                status: invStatus,
                issuedAt,
                paidAt: invStatus === 'PAID' ? addDays(issuedAt, randomBetween(1, 10)) : null,
                createdById: accounts.id,
                createdAt: issuedAt,
                updatedAt: issuedAt,
                items: {
                  create: itemsData.map(i => ({
                    productId: i.productId,
                    productNameSnapshot: i.productNameSnapshot,
                    skuSnapshot: i.skuSnapshot,
                    unitPriceSnapshot: i.unitPriceSnapshot,
                    taxRateSnapshot: i.taxRateSnapshot,
                    quantity: i.quantity,
                    lineSubtotal: i.lineSubtotal,
                    lineTax: i.lineTax,
                    lineTotal: i.lineTotal,
                  })),
                },
              },
            });
            challanStates.push({ challan, invoice: inv });
          }
        } else {
          challanStates.push({ challan, invoice: null });
        }
      }
    }
  }

  // Add a few cancelled challans
  for (let i = 0; i < 5; i++) {
    const challanNum = `CH-2026-${(challanCounter++).toString().padStart(6, '0')}`;
    const customer = activeCustomers[randomBetween(0, 8)];
    const p = salesProds[randomBetween(0, 5)];
    await prisma.challan.upsert({
      where: { challanNumber: challanNum },
      update: {},
      create: {
        challanNumber: challanNum,
        customerId: customer.id,
        subtotal: new Prisma.Decimal(5000),
        taxTotal: new Prisma.Decimal(900),
        grandTotal: new Prisma.Decimal(5900),
        status: 'CANCELLED',
        cancelledAt: daysAgo(randomBetween(5, 30)),
        createdById: sales.id,
        createdAt: daysAgo(randomBetween(5, 30)),
        updatedAt: daysAgo(randomBetween(3, 28)),
        items: {
          create: [{
            productId: p.id,
            productNameSnapshot: p.productName,
            skuSnapshot: p.sku,
            unitPriceSnapshot: p.unitPrice,
            taxRateSnapshot: p.taxRate,
            quantity: 5,
            lineSubtotal: p.unitPrice.mul(5),
            lineTax: p.unitPrice.mul(5).mul(p.taxRate).div(100),
            lineTotal: p.unitPrice.mul(5).mul(new Prisma.Decimal(1).add(p.taxRate.div(100))),
          }],
        },
      },
    });
  }
  console.log('✅ Historical challans, invoices, and stock movements created');

  // ─── 7. FOLLOW-UPS ─────────────────────────────────────────────────────────
  const followUpTypes = ['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'OTHER'];
  const followUpNotes = [
    'Follow up on recent order, check satisfaction',
    'Discuss bulk purchase opportunity for Q3',
    'Payment follow-up for outstanding invoice',
    'New product introduction call',
    'Quarterly review meeting',
    'Check stock requirements for next month',
    'Resolve delivery dispute',
    'Upsell opportunity for safety equipment',
    'Renew annual contract discussion',
    'Demo of new product line',
  ];

  for (const customer of activeCustomers.slice(0, 20)) {
    const numFollowUps = randomBetween(2, 6);
    for (let f = 0; f < numFollowUps; f++) {
      const daysOffset = randomBetween(-60, 30);
      const scheduledAt = addDays(new Date(), daysOffset);
      const isCompleted = daysOffset < -5 && Math.random() > 0.3;
      const isOverdue = daysOffset < 0 && !isCompleted;
      const status = isCompleted ? 'COMPLETED' : isOverdue ? 'OVERDUE' : 'SCHEDULED';

      await prisma.customerFollowUp.create({
        data: {
          customerId: customer.id,
          assignedToId: sales.id,
          scheduledAt,
          completedAt: isCompleted ? addDays(scheduledAt, randomBetween(0, 3)) : null,
          status,
          type: followUpTypes[randomBetween(0, 4)] as any,
          note: followUpNotes[randomBetween(0, 9)],
          outcome: isCompleted ? 'Customer confirmed interest. Follow up next week.' : null,
          createdById: sales.id,
          createdAt: addDays(scheduledAt, -randomBetween(1, 7)),
        },
      });
    }
  }

  // Add overdue follow-ups to some LEAD customers
  for (const customer of customers.filter(c => c.status === 'LEAD').slice(0, 5)) {
    await prisma.customerFollowUp.create({
      data: {
        customerId: customer.id,
        assignedToId: sales.id,
        scheduledAt: daysAgo(randomBetween(3, 15)),
        status: 'OVERDUE',
        type: 'CALL',
        note: 'Initial contact follow-up',
        createdById: sales.id,
        createdAt: daysAgo(randomBetween(10, 20)),
      },
    });
  }
  console.log('✅ Follow-ups created');

  // ─── 8. NOTIFICATIONS ──────────────────────────────────────────────────────
  const lowStockProducts = products.filter(p => p.currentStock <= p.minimumStockAlertQuantity && p.currentStock > 0);
  for (const p of lowStockProducts) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: `${p.productName} has only ${p.currentStock} units remaining (minimum: ${p.minimumStockAlertQuantity})`,
        entityType: 'PRODUCT',
        entityId: p.id,
        isRead: false,
        createdAt: daysAgo(randomBetween(0, 2)),
      },
    });
    await prisma.notification.create({
      data: {
        userId: warehouse.id,
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: `${p.productName} has only ${p.currentStock} units remaining (minimum: ${p.minimumStockAlertQuantity})`,
        entityType: 'PRODUCT',
        entityId: p.id,
        isRead: false,
        createdAt: daysAgo(randomBetween(0, 2)),
      },
    });
  }

  // Add some overdue follow-up notifications
  await prisma.notification.createMany({
    data: [
      { userId: sales.id, type: 'FOLLOWUP_OVERDUE', title: 'Overdue Follow-up', message: 'You have overdue follow-ups that need attention', entityType: 'FOLLOWUP', isRead: false, createdAt: daysAgo(1) },
      { userId: admin.id, type: 'CHALLAN_CONFIRMED', title: 'Challan Confirmed', message: 'Challan CH-2026-000001 has been confirmed', entityType: 'CHALLAN', isRead: true, createdAt: daysAgo(3) },
      { userId: accounts.id, type: 'INVOICE_CREATED', title: 'Invoice Created', message: 'Invoice INV-2026-000001 has been created', entityType: 'INVOICE', isRead: false, createdAt: daysAgo(2) },
    ],
  });
  console.log('✅ Notifications created');

  // ─── 9. AUDIT LOGS ────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'LOGIN', entityType: 'USER', entityId: admin.id, metadata: { email: admin.email } as any, createdAt: daysAgo(0) },
      { userId: sales.id, action: 'LOGIN', entityType: 'USER', entityId: sales.id, metadata: { email: sales.email } as any, createdAt: daysAgo(0) },
      { userId: admin.id, action: 'CUSTOMER_CREATED', entityType: 'CUSTOMER', entityId: customers[0].id, newValues: { customerName: customers[0].customerName } as any, createdAt: daysAgo(30) },
      { userId: sales.id, action: 'CHALLAN_CONFIRMED', entityType: 'CHALLAN', newValues: { challanNumber: 'CH-2026-000001' } as any, createdAt: daysAgo(2) },
    ],
  });
  console.log('✅ Audit logs created');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\nDemo accounts:');
  console.log('  admin@ledger.test    / password123  (ADMIN)');
  console.log('  sales@ledger.test    / password123  (SALES)');
  console.log('  warehouse@ledger.test/ password123  (WAREHOUSE)');
  console.log('  accounts@ledger.test / password123  (ACCOUNTS)');
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

async function upsertUser({ name, email, role, pw }: { name: string; email: string; role: string; pw: string }) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash: pw, role: role as any, status: 'ACTIVE' },
  });
}

async function upsertCategory(name: string) {
  return prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function upsertWarehouse(name: string, location: string) {
  return prisma.warehouse.upsert({
    where: { name },
    update: {},
    create: { name, location },
  });
}

async function upsertProduct(p: {
  sku: string; name: string; cat: string; wh: string;
  unit: number; cost: number; tax: number; stock: number; minStock: number;
}) {
  return prisma.product.upsert({
    where: { sku: p.sku },
    update: {},
    create: {
      productName: p.name,
      sku: p.sku,
      categoryId: p.cat,
      warehouseId: p.wh,
      unitPrice: new Prisma.Decimal(p.unit),
      costPrice: new Prisma.Decimal(p.cost),
      taxRate: new Prisma.Decimal(p.tax),
      currentStock: p.stock,
      minimumStockAlertQuantity: p.minStock,
      status: 'ACTIVE',
    },
  });
}

async function upsertCustomer(c: {
  name: string; biz?: string; email: string; mobile: string; gst?: string | null;
  type: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR'; status: 'LEAD' | 'ACTIVE' | 'INACTIVE'; addr: string;
}) {
  const existing = await prisma.customer.findFirst({ where: { mobileNumber: c.mobile } });
  if (existing) return existing;
  return prisma.customer.create({
    data: {
      customerName: c.name,
      businessName: c.biz || null,
      email: c.email,
      mobileNumber: c.mobile,
      gstNumber: c.gst || null,
      customerType: c.type,
      status: c.status,
      address: c.addr,
    },
  });
}

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
