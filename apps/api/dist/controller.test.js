"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const prisma_1 = require("./lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
(0, vitest_1.describe)('Database & Auth Core Verification', () => {
    (0, vitest_1.it)('Verifies seeded Admin exists and has valid password hash', async () => {
        const admin = await prisma_1.prisma.user.findUnique({
            where: { email: 'admin@pharma.com' },
        });
        (0, vitest_1.expect)(admin).toBeDefined();
        (0, vitest_1.expect)(admin?.role).toBe('ADMIN');
        const valid = await bcryptjs_1.default.compare('password123', admin.passwordHash);
        (0, vitest_1.expect)(valid).toBe(true);
    });
    (0, vitest_1.it)('Verifies seeded Managers and MR hierarchy', async () => {
        const managerNorth = await prisma_1.prisma.user.findUnique({
            where: { email: 'manager.north@pharma.com' },
            include: { reports: true },
        });
        (0, vitest_1.expect)(managerNorth).toBeDefined();
        (0, vitest_1.expect)(managerNorth?.role).toBe('MANAGER');
        (0, vitest_1.expect)(managerNorth?.reports.length).toBe(3); // Rahul, Priya, Amit
    });
    (0, vitest_1.it)('Verifies Doctors and Products seeded correctly', async () => {
        const doctorCount = await prisma_1.prisma.doctor.count();
        const productCount = await prisma_1.prisma.product.count();
        (0, vitest_1.expect)(doctorCount).toBe(20);
        (0, vitest_1.expect)(productCount).toBe(10);
    });
    (0, vitest_1.it)('Verifies Tour Plans and Expenses exist with valid statuses', async () => {
        const pendingPlans = await prisma_1.prisma.tourPlan.count({ where: { status: 'PENDING' } });
        const approvedPlans = await prisma_1.prisma.tourPlan.count({ where: { status: 'APPROVED' } });
        (0, vitest_1.expect)(pendingPlans).toBeGreaterThan(0);
        (0, vitest_1.expect)(approvedPlans).toBeGreaterThan(0);
        const pendingExpenses = await prisma_1.prisma.expense.count({ where: { status: 'PENDING' } });
        (0, vitest_1.expect)(pendingExpenses).toBeGreaterThan(0);
    });
});
