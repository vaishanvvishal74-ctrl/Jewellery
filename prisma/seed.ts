import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@jewellery.com';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error('ADMIN_PASSWORD environment variable is missing');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await prisma.user.updateMany({
    where: {
      email,
      role: 'ADMIN',
    },
    data: {
      password: hashedPassword,
    },
  });

  if (result.count !== 1) {
    throw new Error(
      `Expected exactly one admin account; updated ${result.count}`
    );
  }

  console.log('Admin password updated successfully.');
}

main()
  .catch((error) => {
    console.error('Admin password update failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
