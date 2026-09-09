import { describe, it, expect } from 'vitest';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

describe('Database & Auth Core Verification', () => {
  it('Verifies seeded Admin exists and has valid password hash', async () => {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@pharma.com' },
    });
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('ADMIN');
    const valid = await bcrypt.compare('password123', admin!.passwordHash!);
    expect(valid).toBe(true);
  });

  it('Verifies seeded Managers and MR hierarchy', async () => {
    const managerNorth = await prisma.user.findUnique({
      where: { email: 'manager.north@pharma.com' },
      include: { reports: true },
    });
    expect(managerNorth).toBeDefined();
    expect(managerNorth?.role).toBe('MANAGER');
    expect(managerNorth?.reports.length).toBe(3); // Rahul, Priya, Amit
  });

  it('Verifies Doctors and Products seeded correctly', async () => {
    const doctorCount = await prisma.doctor.count();
    const productCount = await prisma.product.count();
    expect(doctorCount).toBe(20);
    expect(productCount).toBe(10);
  });

  it('Verifies Tour Plans and Expenses exist with valid statuses', async () => {
    const pendingPlans = await prisma.tourPlan.count({ where: { status: 'PENDING' } });
    const approvedPlans = await prisma.tourPlan.count({ where: { status: 'APPROVED' } });
    expect(pendingPlans).toBeGreaterThan(0);
    expect(approvedPlans).toBeGreaterThan(0);

    const pendingExpenses = await prisma.expense.count({ where: { status: 'PENDING' } });
    expect(pendingExpenses).toBeGreaterThan(0);
  });
});
