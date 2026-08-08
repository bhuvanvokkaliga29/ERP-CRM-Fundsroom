import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient(); // Defaults to public schema

async function main() {
  console.log('Seeding main public schema...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@ledger.test' },
    update: {},
    create: {
      name: 'Main Admin',
      email: 'admin@ledger.test',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created successfully in main schema.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
