import { Router, Request, Response, NextFunction } from 'express';
import { tenantStorage } from '../../config/database';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const router = Router();

router.post('/reset', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = tenantStorage.getStore();
    if (tenant !== 'demo') {
      return res.status(403).json({ success: false, message: 'Reset is only allowed in demo mode' });
    }

    // Run the seed script for the demo schema.
    // The seed script will upsert everything, which effectively "resets" the core data.
    // However, to do a full reset (wipe all data first), we'd need to wipe the demo schema.
    // Since wiping the whole schema takes longer, we will just run the seed script with DATABASE_URL having schema=demo.
    
    // In production, we'll use the Render DATABASE_URL with schema=demo.
    // Locally, we'll use the local one. We can just run ts-node or node on the seed script.
    // Since this is just for the hackathon, we can use the prisma seed command.
    
    // Let's execute the seed script!
    await execPromise('npx prisma db seed', {
      env: { ...process.env, DATABASE_URL: (process.env.DATABASE_URL || '').replace('schema=public', 'schema=demo') }
    });

    res.json({ success: true, message: 'Demo environment reset successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/wipe-main', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prisma } = require('../../config/database');
    const bcrypt = require('bcryptjs');

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

    // Recreate admin user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@ledger.test' } });
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@ledger.test',
          passwordHash: hashedPassword,
          role: 'ADMIN',
        }
      });
    }

    res.json({ success: true, message: 'Main schema wiped completely.' });
  } catch (error) {
    next(error);
  }
});

export default router;
