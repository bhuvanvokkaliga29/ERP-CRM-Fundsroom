/**
 * Mock data for frontend-only demo mode.
 * When demoMode is active, the axios interceptor returns this data
 * instead of hitting the backend.
 */

import { format, subDays, addDays } from 'date-fns';

const today = new Date();
const uid = (prefix: string, i: number) => `${prefix}-${String(i).padStart(4, '0')}`;

// ─── Customers ───────────────────────────────────────────────
const CUSTOMERS = [
  { id: uid('cust', 1), customerName: 'Rajesh Traders', businessName: 'Rajesh Enterprises Pvt Ltd', mobileNumber: '9876543210', email: 'rajesh@traders.in', gstNumber: '29ABCDE1234F1Z5', customerType: 'WHOLESALE', status: 'ACTIVE', city: 'Bengaluru', state: 'Karnataka', lifetimeRevenue: 1847500, lastActivity: subDays(today, 2).toISOString(), nextFollowUp: addDays(today, 3).toISOString(), nextFollowUpStatus: 'UPCOMING', createdAt: subDays(today, 180).toISOString() },
  { id: uid('cust', 2), customerName: 'Priya Fashions', businessName: 'Priya Garments', mobileNumber: '9845678901', email: 'priya@fashions.com', gstNumber: '29FGHIJ5678K2L6', customerType: 'RETAIL', status: 'ACTIVE', city: 'Mysuru', state: 'Karnataka', lifetimeRevenue: 956200, lastActivity: subDays(today, 1).toISOString(), nextFollowUp: subDays(today, 1).toISOString(), nextFollowUpStatus: 'OVERDUE', createdAt: subDays(today, 150).toISOString() },
  { id: uid('cust', 3), customerName: 'Vikram Steel Works', businessName: 'VSW Industries', mobileNumber: '9812345670', email: 'vikram@vsw.co.in', gstNumber: '27KLMNO9012P3Q7', customerType: 'DISTRIBUTOR', status: 'ACTIVE', city: 'Pune', state: 'Maharashtra', lifetimeRevenue: 3215000, lastActivity: subDays(today, 5).toISOString(), nextFollowUp: addDays(today, 1).toISOString(), nextFollowUpStatus: 'UPCOMING', createdAt: subDays(today, 365).toISOString() },
  { id: uid('cust', 4), customerName: 'Ananya Organics', businessName: 'Ananya Foods Pvt Ltd', mobileNumber: '9900112233', email: 'ananya@organics.in', gstNumber: '29PQRST3456U4V8', customerType: 'WHOLESALE', status: 'ACTIVE', city: 'Chennai', state: 'Tamil Nadu', lifetimeRevenue: 1234800, lastActivity: subDays(today, 3).toISOString(), nextFollowUp: null, nextFollowUpStatus: null, createdAt: subDays(today, 90).toISOString() },
  { id: uid('cust', 5), customerName: 'Sanjay Electronics', businessName: 'SE Distributors', mobileNumber: '9988776655', email: 'sanjay@elec.com', gstNumber: '07UVWXY7890Z5A9', customerType: 'DISTRIBUTOR', status: 'ACTIVE', city: 'Delhi', state: 'Delhi', lifetimeRevenue: 2780400, lastActivity: subDays(today, 7).toISOString(), nextFollowUp: subDays(today, 3).toISOString(), nextFollowUpStatus: 'OVERDUE', createdAt: subDays(today, 200).toISOString() },
  { id: uid('cust', 6), customerName: 'Meera Textiles', businessName: 'Meera Weavers Co-op', mobileNumber: '9876001234', email: 'meera@textiles.in', gstNumber: '33BCDEF2345G6H0', customerType: 'WHOLESALE', status: 'ACTIVE', city: 'Coimbatore', state: 'Tamil Nadu', lifetimeRevenue: 892100, lastActivity: subDays(today, 4).toISOString(), nextFollowUp: addDays(today, 5).toISOString(), nextFollowUpStatus: 'UPCOMING', createdAt: subDays(today, 120).toISOString() },
  { id: uid('cust', 7), customerName: 'Kiran Hardware', businessName: 'Kiran Supplies', mobileNumber: '9845551234', email: 'kiran@hardware.in', gstNumber: '29GHIJK6789L7M1', customerType: 'RETAIL', status: 'LEAD', city: 'Hubli', state: 'Karnataka', lifetimeRevenue: 0, lastActivity: subDays(today, 10).toISOString(), nextFollowUp: addDays(today, 2).toISOString(), nextFollowUpStatus: 'UPCOMING', createdAt: subDays(today, 14).toISOString() },
  { id: uid('cust', 8), customerName: 'Deepak Pharmaceuticals', businessName: 'Deepak Pharma Ltd', mobileNumber: '9811223344', email: 'deepak@pharma.co.in', gstNumber: '27LMNOP1234Q8R2', customerType: 'DISTRIBUTOR', status: 'ACTIVE', city: 'Mumbai', state: 'Maharashtra', lifetimeRevenue: 4120000, lastActivity: subDays(today, 1).toISOString(), nextFollowUp: today.toISOString(), nextFollowUpStatus: 'DUE_TODAY', createdAt: subDays(today, 400).toISOString() },
  { id: uid('cust', 9), customerName: 'Lakshmi Stores', businessName: null, mobileNumber: '9870001111', email: null, gstNumber: null, customerType: 'RETAIL', status: 'ACTIVE', city: 'Mangalore', state: 'Karnataka', lifetimeRevenue: 345600, lastActivity: subDays(today, 8).toISOString(), nextFollowUp: null, nextFollowUpStatus: null, createdAt: subDays(today, 60).toISOString() },
  { id: uid('cust', 10), customerName: 'Arjun Auto Parts', businessName: 'Arjun Motors', mobileNumber: '9822334455', email: 'arjun@autoparts.in', gstNumber: '29RSTUV5678W9X3', customerType: 'WHOLESALE', status: 'INACTIVE', city: 'Belgaum', state: 'Karnataka', lifetimeRevenue: 567800, lastActivity: subDays(today, 45).toISOString(), nextFollowUp: null, nextFollowUpStatus: null, createdAt: subDays(today, 300).toISOString() },
  { id: uid('cust', 11), customerName: 'Nisha Cosmetics', businessName: 'Nisha Beauty Pvt Ltd', mobileNumber: '9801122334', email: 'nisha@beauty.co', gstNumber: '33YZABC6789D0E4', customerType: 'WHOLESALE', status: 'ACTIVE', city: 'Hyderabad', state: 'Telangana', lifetimeRevenue: 1670000, lastActivity: subDays(today, 2).toISOString(), nextFollowUp: addDays(today, 7).toISOString(), nextFollowUpStatus: 'UPCOMING', createdAt: subDays(today, 250).toISOString() },
  { id: uid('cust', 12), customerName: 'Ganesh Electricals', businessName: 'GE Solutions', mobileNumber: '9866554433', email: 'ganesh@electricals.in', gstNumber: '29EFGHI0123J1K5', customerType: 'RETAIL', status: 'LEAD', city: 'Dharwad', state: 'Karnataka', lifetimeRevenue: 0, lastActivity: subDays(today, 3).toISOString(), nextFollowUp: addDays(today, 1).toISOString(), nextFollowUpStatus: 'UPCOMING', createdAt: subDays(today, 7).toISOString() },
];

// ─── Categories & Warehouses ─────────────────────────────────
const CATEGORIES = [
  { id: 'cat-01', name: 'Raw Materials', _count: { products: 8 } },
  { id: 'cat-02', name: 'Finished Goods', _count: { products: 12 } },
  { id: 'cat-03', name: 'Packaging', _count: { products: 5 } },
  { id: 'cat-04', name: 'Spare Parts', _count: { products: 6 } },
];

const WAREHOUSES = [
  { id: 'wh-01', name: 'Main Warehouse — Bengaluru', location: 'Peenya Industrial Area', _count: { products: 18 } },
  { id: 'wh-02', name: 'Secondary — Mysuru', location: 'Hebbal Industrial Estate', _count: { products: 8 } },
];

// ─── Products ────────────────────────────────────────────────
const PRODUCTS = [
  { id: uid('prod', 1), productName: 'Stainless Steel Rod 12mm', sku: 'SS-ROD-12', categoryId: 'cat-01', category: CATEGORIES[0], warehouseId: 'wh-01', warehouse: WAREHOUSES[0], unitPrice: 4500, costPrice: 3200, taxRate: 18, currentStock: 245, minimumStockAlertQuantity: 50, status: 'ACTIVE', description: 'Premium grade SS rod', createdAt: subDays(today, 200).toISOString() },
  { id: uid('prod', 2), productName: 'Copper Wire 2.5mm', sku: 'CW-25', categoryId: 'cat-01', category: CATEGORIES[0], warehouseId: 'wh-01', warehouse: WAREHOUSES[0], unitPrice: 8900, costPrice: 6800, taxRate: 18, currentStock: 12, minimumStockAlertQuantity: 25, status: 'ACTIVE', description: 'Electrical grade copper wire', createdAt: subDays(today, 180).toISOString() },
  { id: uid('prod', 3), productName: 'Industrial Bearing 6205', sku: 'BRG-6205', categoryId: 'cat-04', category: CATEGORIES[3], warehouseId: 'wh-01', warehouse: WAREHOUSES[0], unitPrice: 350, costPrice: 180, taxRate: 18, currentStock: 580, minimumStockAlertQuantity: 100, status: 'ACTIVE', description: 'Deep groove ball bearing', createdAt: subDays(today, 160).toISOString() },
  { id: uid('prod', 4), productName: 'Aluminium Sheet 3mm', sku: 'AL-SH-3', categoryId: 'cat-01', category: CATEGORIES[0], warehouseId: 'wh-01', warehouse: WAREHOUSES[0], unitPrice: 3200, costPrice: 2400, taxRate: 18, currentStock: 0, minimumStockAlertQuantity: 20, status: 'ACTIVE', description: '3mm thick aluminium sheet', createdAt: subDays(today, 140).toISOString() },
  { id: uid('prod', 5), productName: 'Corrugated Box — Large', sku: 'PKG-CB-L', categoryId: 'cat-03', category: CATEGORIES[2], warehouseId: 'wh-02', warehouse: WAREHOUSES[1], unitPrice: 85, costPrice: 45, taxRate: 12, currentStock: 1200, minimumStockAlertQuantity: 200, status: 'ACTIVE', description: '5-ply corrugated shipping box', createdAt: subDays(today, 120).toISOString() },
  { id: uid('prod', 6), productName: 'PVC Pipe 4 inch', sku: 'PVC-P-4', categoryId: 'cat-02', category: CATEGORIES[1], warehouseId: 'wh-01', warehouse: WAREHOUSES[0], unitPrice: 620, costPrice: 380, taxRate: 18, currentStock: 340, minimumStockAlertQuantity: 60, status: 'ACTIVE', description: 'Schedule 40 PVC pipe 10ft', createdAt: subDays(today, 100).toISOString() },
  { id: uid('prod', 7), productName: 'Hydraulic Cylinder', sku: 'HYD-CYL-50', categoryId: 'cat-04', category: CATEGORIES[3], warehouseId: 'wh-01', warehouse: WAREHOUSES[0], unitPrice: 18500, costPrice: 12000, taxRate: 18, currentStock: 8, minimumStockAlertQuantity: 10, status: 'ACTIVE', description: '50mm bore hydraulic cylinder', createdAt: subDays(today, 90).toISOString() },
  { id: uid('prod', 8), productName: 'Welding Electrode 3.15mm', sku: 'WE-315', categoryId: 'cat-01', category: CATEGORIES[0], warehouseId: 'wh-01', warehouse: WAREHOUSES[0], unitPrice: 1200, costPrice: 800, taxRate: 18, currentStock: 450, minimumStockAlertQuantity: 100, status: 'ACTIVE', description: 'E7018 class electrode 5kg pack', createdAt: subDays(today, 80).toISOString() },
  { id: uid('prod', 9), productName: 'MS Angle 50x50x6', sku: 'MS-ANG-50', categoryId: 'cat-02', category: CATEGORIES[1], warehouseId: 'wh-02', warehouse: WAREHOUSES[1], unitPrice: 5400, costPrice: 4100, taxRate: 18, currentStock: 75, minimumStockAlertQuantity: 30, status: 'ACTIVE', description: 'Mild steel angle 6m length', createdAt: subDays(today, 70).toISOString() },
  { id: uid('prod', 10), productName: 'Shrink Wrap Roll', sku: 'PKG-SW-R', categoryId: 'cat-03', category: CATEGORIES[2], warehouseId: 'wh-02', warehouse: WAREHOUSES[1], unitPrice: 450, costPrice: 280, taxRate: 12, currentStock: 5, minimumStockAlertQuantity: 15, status: 'ACTIVE', description: '500mm width packaging wrap', createdAt: subDays(today, 60).toISOString() },
];

// ─── Challans ────────────────────────────────────────────────
const CHALLANS = [
  { id: uid('ch', 1), challanNumber: 'DC-2026-0142', customerId: CUSTOMERS[0].id, customer: CUSTOMERS[0], status: 'CONFIRMED', subTotal: 135000, taxTotal: 24300, grandTotal: 159300, createdAt: subDays(today, 1).toISOString(), items: [{ productId: PRODUCTS[0].id, productNameSnapshot: PRODUCTS[0].productName, quantity: 30, unitPrice: 4500 }] },
  { id: uid('ch', 2), challanNumber: 'DC-2026-0141', customerId: CUSTOMERS[2].id, customer: CUSTOMERS[2], status: 'CONFIRMED', subTotal: 222000, taxTotal: 39960, grandTotal: 261960, createdAt: subDays(today, 2).toISOString(), items: [{ productId: PRODUCTS[6].id, productNameSnapshot: PRODUCTS[6].productName, quantity: 12, unitPrice: 18500 }] },
  { id: uid('ch', 3), challanNumber: 'DC-2026-0140', customerId: CUSTOMERS[1].id, customer: CUSTOMERS[1], status: 'DRAFT', subTotal: 44500, taxTotal: 8010, grandTotal: 52510, createdAt: subDays(today, 2).toISOString(), items: [{ productId: PRODUCTS[2].id, productNameSnapshot: PRODUCTS[2].productName, quantity: 50, unitPrice: 350 }, { productId: PRODUCTS[5].id, productNameSnapshot: PRODUCTS[5].productName, quantity: 45, unitPrice: 620 }] },
  { id: uid('ch', 4), challanNumber: 'DC-2026-0139', customerId: CUSTOMERS[4].id, customer: CUSTOMERS[4], status: 'CONFIRMED', subTotal: 89000, taxTotal: 16020, grandTotal: 105020, createdAt: subDays(today, 3).toISOString(), items: [{ productId: PRODUCTS[1].id, productNameSnapshot: PRODUCTS[1].productName, quantity: 10, unitPrice: 8900 }] },
  { id: uid('ch', 5), challanNumber: 'DC-2026-0138', customerId: CUSTOMERS[7].id, customer: CUSTOMERS[7], status: 'CONFIRMED', subTotal: 324000, taxTotal: 58320, grandTotal: 382320, createdAt: subDays(today, 4).toISOString(), items: [{ productId: PRODUCTS[8].id, productNameSnapshot: PRODUCTS[8].productName, quantity: 60, unitPrice: 5400 }] },
  { id: uid('ch', 6), challanNumber: 'DC-2026-0137', customerId: CUSTOMERS[3].id, customer: CUSTOMERS[3], status: 'CONFIRMED', subTotal: 96000, taxTotal: 17280, grandTotal: 113280, createdAt: subDays(today, 5).toISOString(), items: [{ productId: PRODUCTS[7].id, productNameSnapshot: PRODUCTS[7].productName, quantity: 80, unitPrice: 1200 }] },
  { id: uid('ch', 7), challanNumber: 'DC-2026-0136', customerId: CUSTOMERS[5].id, customer: CUSTOMERS[5], status: 'DRAFT', subTotal: 17000, taxTotal: 2040, grandTotal: 19040, createdAt: subDays(today, 5).toISOString(), items: [{ productId: PRODUCTS[4].id, productNameSnapshot: PRODUCTS[4].productName, quantity: 200, unitPrice: 85 }] },
  { id: uid('ch', 8), challanNumber: 'DC-2026-0135', customerId: CUSTOMERS[10].id, customer: CUSTOMERS[10], status: 'CONFIRMED', subTotal: 186000, taxTotal: 33480, grandTotal: 219480, createdAt: subDays(today, 6).toISOString(), items: [{ productId: PRODUCTS[6].id, productNameSnapshot: PRODUCTS[6].productName, quantity: 10, unitPrice: 18500 }, { productId: PRODUCTS[0].id, productNameSnapshot: PRODUCTS[0].productName, quantity: 2, unitPrice: 4500 }] },
];

// ─── Invoices ────────────────────────────────────────────────
const INVOICES = [
  { id: uid('inv', 1), invoiceNumber: 'INV-2026-0089', customerId: CUSTOMERS[0].id, customer: CUSTOMERS[0], challanId: CHALLANS[0].id, challan: { challanNumber: CHALLANS[0].challanNumber }, status: 'PAID', subTotal: 135000, taxTotal: 24300, grandTotal: 159300, dueDate: subDays(today, 5).toISOString(), createdAt: subDays(today, 1).toISOString() },
  { id: uid('inv', 2), invoiceNumber: 'INV-2026-0088', customerId: CUSTOMERS[2].id, customer: CUSTOMERS[2], challanId: CHALLANS[1].id, challan: { challanNumber: CHALLANS[1].challanNumber }, status: 'ISSUED', subTotal: 222000, taxTotal: 39960, grandTotal: 261960, dueDate: addDays(today, 15).toISOString(), createdAt: subDays(today, 2).toISOString() },
  { id: uid('inv', 3), invoiceNumber: 'INV-2026-0087', customerId: CUSTOMERS[4].id, customer: CUSTOMERS[4], challanId: CHALLANS[3].id, challan: { challanNumber: CHALLANS[3].challanNumber }, status: 'PAID', subTotal: 89000, taxTotal: 16020, grandTotal: 105020, dueDate: subDays(today, 10).toISOString(), createdAt: subDays(today, 3).toISOString() },
  { id: uid('inv', 4), invoiceNumber: 'INV-2026-0086', customerId: CUSTOMERS[7].id, customer: CUSTOMERS[7], challanId: CHALLANS[4].id, challan: { challanNumber: CHALLANS[4].challanNumber }, status: 'ISSUED', subTotal: 324000, taxTotal: 58320, grandTotal: 382320, dueDate: addDays(today, 10).toISOString(), createdAt: subDays(today, 4).toISOString() },
  { id: uid('inv', 5), invoiceNumber: 'INV-2026-0085', customerId: CUSTOMERS[3].id, customer: CUSTOMERS[3], challanId: CHALLANS[5].id, challan: { challanNumber: CHALLANS[5].challanNumber }, status: 'PAID', subTotal: 96000, taxTotal: 17280, grandTotal: 113280, dueDate: subDays(today, 2).toISOString(), createdAt: subDays(today, 5).toISOString() },
  { id: uid('inv', 6), invoiceNumber: 'INV-2026-0084', customerId: CUSTOMERS[10].id, customer: CUSTOMERS[10], challanId: CHALLANS[7].id, challan: { challanNumber: CHALLANS[7].challanNumber }, status: 'DRAFT', subTotal: 186000, taxTotal: 33480, grandTotal: 219480, dueDate: addDays(today, 20).toISOString(), createdAt: subDays(today, 6).toISOString() },
];

// ─── Follow-ups ──────────────────────────────────────────────
const FOLLOWUPS = [
  { id: uid('fu', 1), customerId: CUSTOMERS[1].id, customer: CUSTOMERS[1], type: 'CALL', status: 'OVERDUE', scheduledAt: subDays(today, 1).toISOString(), notes: 'Follow up on pending order', outcome: null, createdAt: subDays(today, 5).toISOString() },
  { id: uid('fu', 2), customerId: CUSTOMERS[4].id, customer: CUSTOMERS[4], type: 'VISIT', status: 'OVERDUE', scheduledAt: subDays(today, 3).toISOString(), notes: 'Discuss bulk pricing', outcome: null, createdAt: subDays(today, 10).toISOString() },
  { id: uid('fu', 3), customerId: CUSTOMERS[7].id, customer: CUSTOMERS[7], type: 'CALL', status: 'SCHEDULED', scheduledAt: today.toISOString(), notes: 'Payment collection', outcome: null, createdAt: subDays(today, 3).toISOString() },
  { id: uid('fu', 4), customerId: CUSTOMERS[0].id, customer: CUSTOMERS[0], type: 'EMAIL', status: 'SCHEDULED', scheduledAt: addDays(today, 3).toISOString(), notes: 'Send quotation for Q4', outcome: null, createdAt: subDays(today, 1).toISOString() },
  { id: uid('fu', 5), customerId: CUSTOMERS[2].id, customer: CUSTOMERS[2], type: 'VISIT', status: 'SCHEDULED', scheduledAt: addDays(today, 1).toISOString(), notes: 'Quality inspection visit', outcome: null, createdAt: subDays(today, 2).toISOString() },
  { id: uid('fu', 6), customerId: CUSTOMERS[5].id, customer: CUSTOMERS[5], type: 'CALL', status: 'COMPLETED', scheduledAt: subDays(today, 4).toISOString(), notes: 'Order confirmation', outcome: 'Confirmed 200 units for next month', createdAt: subDays(today, 8).toISOString() },
  { id: uid('fu', 7), customerId: CUSTOMERS[6].id, customer: CUSTOMERS[6], type: 'CALL', status: 'SCHEDULED', scheduledAt: addDays(today, 2).toISOString(), notes: 'Convert lead to customer', outcome: null, createdAt: subDays(today, 1).toISOString() },
  { id: uid('fu', 8), customerId: CUSTOMERS[10].id, customer: CUSTOMERS[10], type: 'EMAIL', status: 'COMPLETED', scheduledAt: subDays(today, 2).toISOString(), notes: 'Send updated catalog', outcome: 'Catalog sent, interested in 3 new products', createdAt: subDays(today, 5).toISOString() },
];

// ─── Returns ─────────────────────────────────────────────────
const RETURNS = [
  { id: uid('ret', 1), returnNumber: 'SR-2026-0012', challanId: CHALLANS[0].id, challan: { challanNumber: CHALLANS[0].challanNumber }, customerId: CUSTOMERS[0].id, customer: CUSTOMERS[0], status: 'APPROVED', totalRefund: 13500, reason: 'Dimensional mismatch', createdAt: subDays(today, 2).toISOString(), items: [{ productId: PRODUCTS[0].id, productName: PRODUCTS[0].productName, quantity: 3, unitPrice: 4500 }] },
  { id: uid('ret', 2), returnNumber: 'SR-2026-0011', challanId: CHALLANS[3].id, challan: { challanNumber: CHALLANS[3].challanNumber }, customerId: CUSTOMERS[4].id, customer: CUSTOMERS[4], status: 'PENDING', totalRefund: 26700, reason: 'Quality issue — surface defects', createdAt: subDays(today, 5).toISOString(), items: [{ productId: PRODUCTS[1].id, productName: PRODUCTS[1].productName, quantity: 3, unitPrice: 8900 }] },
  { id: uid('ret', 3), returnNumber: 'SR-2026-0010', challanId: CHALLANS[5].id, challan: { challanNumber: CHALLANS[5].challanNumber }, customerId: CUSTOMERS[3].id, customer: CUSTOMERS[3], status: 'COMPLETED', totalRefund: 14400, reason: 'Wrong item shipped', createdAt: subDays(today, 12).toISOString(), items: [{ productId: PRODUCTS[7].id, productName: PRODUCTS[7].productName, quantity: 12, unitPrice: 1200 }] },
];

// ─── Notifications ───────────────────────────────────────────
const NOTIFICATIONS = [
  { id: uid('notif', 1), title: 'Low Stock Alert', message: 'Aluminium Sheet 3mm is out of stock', isRead: false, createdAt: subDays(today, 0).toISOString() },
  { id: uid('notif', 2), title: 'New Challan Created', message: 'DC-2026-0142 created for Rajesh Traders', isRead: false, createdAt: subDays(today, 1).toISOString() },
  { id: uid('notif', 3), title: 'Payment Received', message: '₹1,59,300 received from Rajesh Traders', isRead: true, createdAt: subDays(today, 1).toISOString() },
  { id: uid('notif', 4), title: 'Overdue Follow-up', message: 'Follow-up with Priya Fashions is overdue', isRead: false, createdAt: subDays(today, 1).toISOString() },
  { id: uid('notif', 5), title: 'Return Request', message: 'Return SR-2026-0011 pending approval', isRead: true, createdAt: subDays(today, 5).toISOString() },
];

// ─── Stock Movements ─────────────────────────────────────────
const STOCK_MOVEMENTS = [
  { id: uid('mv', 1), productId: PRODUCTS[0].id, product: { productName: PRODUCTS[0].productName }, type: 'OUT', quantity: -30, reason: 'CHALLAN', referenceId: CHALLANS[0].id, note: `Challan ${CHALLANS[0].challanNumber}`, createdAt: subDays(today, 1).toISOString() },
  { id: uid('mv', 2), productId: PRODUCTS[6].id, product: { productName: PRODUCTS[6].productName }, type: 'OUT', quantity: -12, reason: 'CHALLAN', referenceId: CHALLANS[1].id, note: `Challan ${CHALLANS[1].challanNumber}`, createdAt: subDays(today, 2).toISOString() },
  { id: uid('mv', 3), productId: PRODUCTS[0].id, product: { productName: PRODUCTS[0].productName }, type: 'IN', quantity: 100, reason: 'PURCHASE', referenceId: null, note: 'Received from supplier', createdAt: subDays(today, 3).toISOString() },
  { id: uid('mv', 4), productId: PRODUCTS[1].id, product: { productName: PRODUCTS[1].productName }, type: 'OUT', quantity: -10, reason: 'CHALLAN', referenceId: CHALLANS[3].id, note: `Challan ${CHALLANS[3].challanNumber}`, createdAt: subDays(today, 3).toISOString() },
  { id: uid('mv', 5), productId: PRODUCTS[2].id, product: { productName: PRODUCTS[2].productName }, type: 'IN', quantity: 200, reason: 'PURCHASE', referenceId: null, note: 'Bulk purchase from NTN India', createdAt: subDays(today, 5).toISOString() },
  { id: uid('mv', 6), productId: PRODUCTS[3].id, product: { productName: PRODUCTS[3].productName }, type: 'IN', quantity: 3, reason: 'RETURN', referenceId: RETURNS[0].id, note: `Return ${RETURNS[0].returnNumber}`, createdAt: subDays(today, 2).toISOString() },
  { id: uid('mv', 7), productId: PRODUCTS[8].id, product: { productName: PRODUCTS[8].productName }, type: 'OUT', quantity: -60, reason: 'CHALLAN', referenceId: CHALLANS[4].id, note: `Challan ${CHALLANS[4].challanNumber}`, createdAt: subDays(today, 4).toISOString() },
  { id: uid('mv', 8), productId: PRODUCTS[4].id, product: { productName: PRODUCTS[4].productName }, type: 'IN', quantity: 500, reason: 'PURCHASE', referenceId: null, note: 'Packaging restock', createdAt: subDays(today, 6).toISOString() },
];

// ─── Revenue Trend (last 30 days) ────────────────────────────
const REVENUE_TREND = Array.from({ length: 30 }, (_, i) => {
  const d = subDays(today, 29 - i);
  const base = 25000 + Math.sin(i * 0.5) * 15000 + Math.random() * 20000;
  return { date: format(d, 'yyyy-MM-dd'), revenue: Math.round(base) };
});

// ─── Dashboard KPIs ──────────────────────────────────────────
const DASHBOARD = {
  kpis: {
    revenue: { value: 1241360, change: 12.4 },
    customers: { active: CUSTOMERS.filter(c => c.status === 'ACTIVE').length, leads: CUSTOMERS.filter(c => c.status === 'LEAD').length },
    challans: { draft: CHALLANS.filter(c => c.status === 'DRAFT').length, confirmed30d: CHALLANS.filter(c => c.status === 'CONFIRMED').length },
    lowStockProducts: PRODUCTS.filter(p => p.currentStock <= p.minimumStockAlertQuantity).length,
  },
  revenueTrend: REVENUE_TREND,
  topProducts: [
    { name: 'Hydraulic Cylinder', revenue: 407000 },
    { name: 'MS Angle 50x50x6', revenue: 324000 },
    { name: 'Stainless Steel Rod 12mm', revenue: 279000 },
    { name: 'Copper Wire 2.5mm', revenue: 178000 },
    { name: 'Welding Electrode 3.15mm', revenue: 144000 },
  ],
  topCustomers: [
    { id: CUSTOMERS[7].id, name: CUSTOMERS[7].customerName, revenue: 382320 },
    { id: CUSTOMERS[2].id, name: CUSTOMERS[2].customerName, revenue: 261960 },
    { id: CUSTOMERS[10].id, name: CUSTOMERS[10].customerName, revenue: 219480 },
    { id: CUSTOMERS[0].id, name: CUSTOMERS[0].customerName, revenue: 159300 },
    { id: CUSTOMERS[3].id, name: CUSTOMERS[3].customerName, revenue: 113280 },
  ],
  recentChallans: CHALLANS.slice(0, 5),
  overdueFollowUps: FOLLOWUPS.filter(f => f.status === 'OVERDUE'),
  lowStockAlerts: PRODUCTS.filter(p => p.currentStock <= p.minimumStockAlertQuantity).map(p => ({
    productName: p.productName,
    currentStock: p.currentStock,
    minimumStockAlertQuantity: p.minimumStockAlertQuantity,
  })),
};

// ─── Analytics ───────────────────────────────────────────────
const ANALYTICS_SALES = {
  summary: { totalRevenue: 1241360, totalChallans: 8, averageOrderValue: 155170, confirmedRate: 75 },
  revenueTrend: REVENUE_TREND,
  topProducts: DASHBOARD.topProducts.map(p => ({ productName: p.name, totalRevenue: p.revenue })),
  topCustomers: DASHBOARD.topCustomers.map(c => ({ customerName: c.name, totalRevenue: c.revenue })),
  statusBreakdown: [
    { status: 'CONFIRMED', count: 6, revenue: 1241360 },
    { status: 'DRAFT', count: 2, revenue: 71550 },
  ],
};

const ANALYTICS_CUSTOMERS = {
  summary: { total: CUSTOMERS.length, active: 9, leads: 2, inactive: 1 },
  topByRevenue: DASHBOARD.topCustomers.map(c => ({ customerName: c.name, totalRevenue: c.revenue })),
  typeBreakdown: [
    { customerType: 'WHOLESALE', count: 4 },
    { customerType: 'DISTRIBUTOR', count: 3 },
    { customerType: 'RETAIL', count: 5 },
  ],
  recentlyAdded: CUSTOMERS.slice(-3).map(c => ({ customerName: c.customerName, createdAt: c.createdAt })),
};

const ANALYTICS_INVENTORY = {
  summary: { totalProducts: PRODUCTS.length, totalValue: 4829750, lowStockCount: 4, outOfStockCount: 1 },
  lowStockProducts: PRODUCTS.filter(p => p.currentStock <= p.minimumStockAlertQuantity).map(p => ({
    productName: p.productName,
    currentStock: p.currentStock,
    minimumStockAlertQuantity: p.minimumStockAlertQuantity,
  })),
  categoryBreakdown: CATEGORIES.map(c => ({ categoryName: c.name, productCount: c._count.products, totalValue: Math.round(Math.random() * 1500000 + 500000) })),
  topByValue: PRODUCTS.sort((a, b) => (b.unitPrice * b.currentStock) - (a.unitPrice * a.currentStock)).slice(0, 5).map(p => ({
    productName: p.productName,
    totalValue: p.unitPrice * p.currentStock,
  })),
};

// ─── Users (admin page) ──────────────────────────────────────
const USERS = [
  { id: 'demo-admin', name: 'Demo Admin', email: 'admin@ledger.test', role: 'ADMIN', status: 'ACTIVE', lastLoginAt: today.toISOString(), createdAt: subDays(today, 365).toISOString() },
  { id: 'demo-sales', name: 'Demo Sales', email: 'sales@ledger.test', role: 'SALES', status: 'ACTIVE', lastLoginAt: subDays(today, 1).toISOString(), createdAt: subDays(today, 300).toISOString() },
  { id: 'demo-warehouse', name: 'Demo Warehouse', email: 'warehouse@ledger.test', role: 'WAREHOUSE', status: 'ACTIVE', lastLoginAt: subDays(today, 2).toISOString(), createdAt: subDays(today, 280).toISOString() },
  { id: 'demo-accounts', name: 'Demo Accounts', email: 'accounts@ledger.test', role: 'ACCOUNTS', status: 'ACTIVE', lastLoginAt: subDays(today, 1).toISOString(), createdAt: subDays(today, 250).toISOString() },
];

// ─── Audit Logs ──────────────────────────────────────────────
const AUDIT_LOGS = [
  { id: uid('audit', 1), userId: 'demo-admin', user: USERS[0], action: 'LOGIN', entityType: 'USER', entityId: 'demo-admin', metadata: { email: 'admin@ledger.test' }, createdAt: today.toISOString() },
  { id: uid('audit', 2), userId: 'demo-sales', user: USERS[1], action: 'CREATE', entityType: 'CHALLAN', entityId: CHALLANS[0].id, metadata: { challanNumber: CHALLANS[0].challanNumber }, createdAt: subDays(today, 1).toISOString() },
  { id: uid('audit', 3), userId: 'demo-admin', user: USERS[0], action: 'UPDATE', entityType: 'PRODUCT', entityId: PRODUCTS[0].id, metadata: { productName: PRODUCTS[0].productName, field: 'stock' }, createdAt: subDays(today, 2).toISOString() },
  { id: uid('audit', 4), userId: 'demo-accounts', user: USERS[3], action: 'CREATE', entityType: 'INVOICE', entityId: INVOICES[0].id, metadata: { invoiceNumber: INVOICES[0].invoiceNumber }, createdAt: subDays(today, 2).toISOString() },
  { id: uid('audit', 5), userId: 'demo-warehouse', user: USERS[2], action: 'UPDATE', entityType: 'PRODUCT', entityId: PRODUCTS[2].id, metadata: { productName: PRODUCTS[2].productName, field: 'stock' }, createdAt: subDays(today, 3).toISOString() },
];


// ─── Route Matcher ───────────────────────────────────────────
function paginate(items: any[], params: URLSearchParams) {
  const page = parseInt(params.get('page') || '1');
  const limit = parseInt(params.get('limit') || '20');
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);
  return {
    pagination: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) },
  };
}

/**
 * Given a URL string, return mock response data if it matches a known route.
 * Returns null if no match (will fall through to real API).
 */
export function getMockResponse(url: string): any | null {
  // Strip base URL if present
  const path = url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/api\/v1/, '');
  const [pathPart, queryString] = path.split('?');
  const params = new URLSearchParams(queryString || '');
  const segments = pathPart.split('/').filter(Boolean);

  // GET /dashboard
  if (pathPart === '/dashboard') {
    return { success: true, data: DASHBOARD };
  }

  // GET /customers or /customers/:id
  if (segments[0] === 'customers') {
    if (segments[1]) {
      const c = CUSTOMERS.find(c => c.id === segments[1]) || CUSTOMERS[0];
      return {
        success: true,
        data: {
          ...c,
          metrics: {
            lifetimeRevenue: c.lifetimeRevenue || 1250000,
            totalOrders: 14,
            averageOrderValue: Math.round((c.lifetimeRevenue || 1250000) / 14),
            lastPurchase: subDays(today, 2).toISOString(),
            daysSincePurchase: 2,
          },
          challans: CHALLANS.filter(ch => ch.customerId === c.id),
          followUps: FOLLOWUPS.filter(f => f.customerId === c.id),
        },
      };
    }
    const search = (params.get('search') || '').toLowerCase();
    let filtered = CUSTOMERS;
    if (search) filtered = filtered.filter(c => c.customerName.toLowerCase().includes(search) || c.businessName?.toLowerCase().includes(search) || c.mobileNumber.includes(search));
    const statusFilter = params.get('status');
    if (statusFilter) filtered = filtered.filter(c => c.status === statusFilter);
    const typeFilter = params.get('customerType');
    if (typeFilter) filtered = filtered.filter(c => c.customerType === typeFilter);
    const pag = paginate(filtered, params);
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '20');
    return { success: true, data: { customers: filtered.slice((page - 1) * limit, page * limit) }, ...pag };
  }

  // GET /products
  if (segments[0] === 'products') {
    if (segments[1] && segments[1] !== 'categories') {
      const p = PRODUCTS.find(p => p.id === segments[1]);
      return { success: true, data: p || PRODUCTS[0] };
    }
    if (segments[1] === 'categories') {
      return { success: true, data: CATEGORIES };
    }
    const search = (params.get('search') || '').toLowerCase();
    let filtered = PRODUCTS;
    if (search) filtered = filtered.filter(p => p.productName.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search));
    const pag = paginate(filtered, params);
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '20');
    return { success: true, data: { products: filtered.slice((page - 1) * limit, page * limit), categories: CATEGORIES, warehouses: WAREHOUSES }, ...pag };
  }

  // GET /inventory
  if (segments[0] === 'inventory') {
    if (segments[1] === 'movements' || pathPart.includes('movements')) {
      const page = parseInt(params.get('page') || '1');
      const limit = parseInt(params.get('limit') || '20');
      return { success: true, data: { movements: STOCK_MOVEMENTS.slice((page - 1) * limit, page * limit) }, pagination: { page, limit, total: STOCK_MOVEMENTS.length, pages: 1 } };
    }
    return { success: true, data: { products: PRODUCTS, categories: CATEGORIES, warehouses: WAREHOUSES }, pagination: { page: 1, limit: 20, total: PRODUCTS.length, pages: 1 } };
  }

  // GET /challans
  if (segments[0] === 'challans') {
    if (segments[1]) {
      const ch = CHALLANS.find(c => c.id === segments[1]);
      return { success: true, data: ch || CHALLANS[0] };
    }
    const search = (params.get('search') || '').toLowerCase();
    let filtered = CHALLANS;
    if (search) filtered = filtered.filter(c => c.challanNumber.toLowerCase().includes(search) || c.customer.customerName.toLowerCase().includes(search));
    const statusFilter = params.get('status');
    if (statusFilter) filtered = filtered.filter(c => c.status === statusFilter);
    const pag = paginate(filtered, params);
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '20');
    return { success: true, data: { challans: filtered.slice((page - 1) * limit, page * limit) }, ...pag };
  }

  // GET /invoices
  if (segments[0] === 'invoices') {
    if (segments[1]) {
      const inv = INVOICES.find(i => i.id === segments[1]);
      return { success: true, data: inv || INVOICES[0] };
    }
    const search = (params.get('search') || '').toLowerCase();
    let filtered = INVOICES;
    if (search) filtered = filtered.filter(i => i.invoiceNumber.toLowerCase().includes(search) || i.customer.customerName.toLowerCase().includes(search));
    const statusFilter = params.get('status');
    if (statusFilter) filtered = filtered.filter(i => i.status === statusFilter);
    const pag = paginate(filtered, params);
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '20');
    return { success: true, data: { invoices: filtered.slice((page - 1) * limit, page * limit) }, ...pag };
  }

  // GET /returns
  if (segments[0] === 'returns') {
    if (segments[1]) {
      const ret = RETURNS.find(r => r.id === segments[1]);
      return { success: true, data: ret || RETURNS[0] };
    }
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '20');
    return { success: true, data: { returns: RETURNS.slice((page - 1) * limit, page * limit) }, pagination: { page, limit, total: RETURNS.length, pages: 1 } };
  }

  // GET /followups
  if (segments[0] === 'followups') {
    let filtered = FOLLOWUPS;
    const statusFilter = params.get('status');
    if (statusFilter) filtered = filtered.filter(f => f.status === statusFilter);
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '20');
    return { success: true, data: { followUps: filtered.slice((page - 1) * limit, page * limit) }, pagination: { page, limit, total: filtered.length, pages: 1 } };
  }

  // GET /notifications
  if (segments[0] === 'notifications') {
    return { success: true, data: { notifications: NOTIFICATIONS, unreadCount: NOTIFICATIONS.filter(n => !n.isRead).length } };
  }

  // GET /intelligence/*
  if (segments[0] === 'intelligence') {
    if (segments[1] === 'business-brief') {
      return {
        success: true,
        data: {
          kpis: [
            { label: 'Monthly Revenue', value: '₹12,41,360' },
            { label: 'Active Customers', value: `${CUSTOMERS.filter(c => c.status === 'ACTIVE').length}` },
            { label: 'Pending Challans', value: `${CHALLANS.filter(c => c.status === 'DRAFT').length}` },
            { label: 'Low Stock Alerts', value: `${PRODUCTS.filter(p => p.currentStock <= p.minimumStockAlertQuantity).length} items` },
          ],
          urgentAlerts: [
            'Priya Fashions: Payment follow-up is overdue by 1 day',
            'Aluminium Sheet 3mm is completely out of stock',
            'Copper Wire 2.5mm is below safety threshold (12 / 25)',
          ],
        },
      };
    }
    if (segments[1] === 'customers') {
      return {
        success: true,
        data: {
          healthScore: 84,
          churnRisk: 'LOW',
          riskReasons: [
            'Regular repeat purchase pattern over the last 90 days',
            'Prompt invoice clearances with average 12-day payment cycle',
          ],
          scoreFactors: [
            { factor: 'RECENCY', explanation: 'Recent order placed 2 days ago', score: 95 },
            { factor: 'FREQUENCY', explanation: 'Stable order velocity with 2.8 challans/month', score: 85 },
            { factor: 'PAYMENT', explanation: 'Nil payment defaults in historical ledger', score: 92 },
            { factor: 'ENGAGEMENT', explanation: 'High response rate on scheduled follow-ups', score: 88 },
          ],
        },
      };
    }
    return { success: true, data: null };
  }

  // GET /analytics/*
  if (segments[0] === 'analytics') {
    if (segments[1] === 'sales') return { success: true, data: ANALYTICS_SALES };
    if (segments[1] === 'customers') return { success: true, data: ANALYTICS_CUSTOMERS };
    if (segments[1] === 'inventory') return { success: true, data: ANALYTICS_INVENTORY };
    return { success: true, data: ANALYTICS_SALES };
  }

  // GET /users
  if (segments[0] === 'users') {
    return { success: true, data: { users: USERS }, pagination: { page: 1, limit: 20, total: USERS.length, pages: 1 } };
  }

  // GET /audit
  if (segments[0] === 'audit') {
    return { success: true, data: { logs: AUDIT_LOGS }, pagination: { page: 1, limit: 20, total: AUDIT_LOGS.length, pages: 1 } };
  }

  // GET /auth/me
  if (pathPart === '/auth/me' || (segments[0] === 'auth' && segments[1] === 'me')) {
    const role = localStorage.getItem('demoRole') || 'ADMIN';
    const user = USERS.find(u => u.role === role) || USERS[0];
    return { success: true, data: user };
  }

  // Fallback — return empty success
  return { success: true, data: {} };
}
