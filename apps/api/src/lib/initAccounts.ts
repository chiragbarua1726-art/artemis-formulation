import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function ensureDefaultAccounts() {
  try {
    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 1. Manager account
    await prisma.user.upsert({
      where: { email: 'manager@artemis.test' },
      update: {
        passwordHash,
        role: 'MANAGER',
        active: true,
        emailVerified: true,
      },
      create: {
        name: 'Regional Manager',
        email: 'manager@artemis.test',
        passwordHash,
        role: 'MANAGER',
        active: true,
        emailVerified: true,
        region: 'North Derma',
        phone: '+91 98111 23456',
      },
    });

    // 2. Admin account
    await prisma.user.upsert({
      where: { email: 'admin@artemis.test' },
      update: {
        passwordHash,
        role: 'ADMIN',
        active: true,
        emailVerified: true,
      },
      create: {
        name: 'Head of Operations (Admin)',
        email: 'admin@artemis.test',
        passwordHash,
        role: 'ADMIN',
        active: true,
        emailVerified: true,
        region: 'National Headquarters',
        phone: '+91 98100 12345',
      },
    });

    // 3. MR account
    await prisma.user.upsert({
      where: { email: 'mr@artemis.test' },
      update: {
        passwordHash,
        role: 'MR',
        active: true,
        emailVerified: true,
      },
      create: {
        name: 'Field Sales Rep (MR)',
        email: 'mr@artemis.test',
        passwordHash,
        role: 'MR',
        active: true,
        emailVerified: true,
        region: 'Delhi-NCR Aesthetic Clinics',
        phone: '+91 99101 44551',
      },
    });

    console.log('✅ Default accounts verified: manager@artemis.test, admin@artemis.test, mr@artemis.test');
  } catch (err) {
    console.error('Error ensuring default accounts:', err);
  }
}
