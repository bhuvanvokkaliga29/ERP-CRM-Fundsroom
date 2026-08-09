import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';

const PORT = parseInt(env.PORT, 10);

async function main() {
  try {
    // TEMPORARY HACK: Wipe the main schema on boot to fix the mock data issue on Render
    try {
      console.log('🔥 TEMPORARY HACK: Wiping main schema on boot...');
      const dbUrl = process.env.DATABASE_URL || '';
      const tempPrisma = new (require('@prisma/client').PrismaClient)({ datasources: { db: { url: dbUrl } } });
      await tempPrisma.$executeRawUnsafe(`
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
      await tempPrisma.$disconnect();
      console.log('✅ TEMPORARY HACK: Main schema wiped successfully!');
    } catch (e) {
      console.error('❌ TEMPORARY HACK: Failed to wipe main schema:', e);
    }

    // Attempt to connect to the database connection
    await prisma.$connect();
    console.log('✓ Database connected');

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`  Environment: ${env.NODE_ENV}`);
      console.log(`  Health: http://localhost:${PORT}/api/health`);
      console.log(`  API: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
