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
    
    let dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl && !dbUrl.includes('schema=')) {
      dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'schema=demo';
    } else if (dbUrl) {
      dbUrl = dbUrl.replace(/schema=[^&]+/, 'schema=demo');
    }

    const { prisma } = require('../../config/database');
    await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS demo;');
    
    await execPromise('npx prisma db seed', {
      env: { ...process.env, DATABASE_URL: dbUrl }
    });

    res.json({ success: true, message: 'Demo environment reset successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/wipe-main', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');

    // Do not modify the schema! Connect to the EXACT same database the main app uses.
    const dbUrl = process.env.DATABASE_URL || '';
    const tempPrisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

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

    // Recreate admin user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const existingAdmin = await tempPrisma.user.findUnique({ where: { email: 'admin@ledger.test' } });
    if (!existingAdmin) {
      await tempPrisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@ledger.test',
          passwordHash: hashedPassword,
          role: 'ADMIN',
        }
      });
    }

    await tempPrisma.$disconnect();

    res.json({ success: true, message: 'Main schema wiped completely.' });
  } catch (error) {
    next(error);
  }
});

export default router;
