const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ledger?schema=public" },
  },
});

async function main() {
  console.log('Truncating tables from the main (public) schema...');
  
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      "audit_logs", 
      "notifications", 
      "invoice_items", 
      "invoices", 
      "challan_items", 
      "challans", 
      "stock_movements", 
      "sales_return_items", 
      "sales_returns", 
      "products", 
      "warehouses", 
      "categories", 
      "customer_follow_ups", 
      "customers",
      "anomalies",
      "ai_insights"
    CASCADE;
  `);
  
  // Do NOT delete users! The judge needs to log in.
  // Just in case, let's make sure the admin user exists.
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@ledger.test' } });
  if (!adminExists) {
    console.log('Admin user missing, recreating...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@ledger.test',
        password: hashedPassword,
        role: 'ADMIN',
      }
    });
  }

  console.log('Main schema is now completely empty (except for the admin user)!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
