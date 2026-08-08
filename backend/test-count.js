const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.user.count();
    console.log('Users in schema:', count);
  } finally {
    await prisma.$disconnect();
  }
}
main();
