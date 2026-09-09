"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("./server"));
(0, vitest_1.describe)('Aegis MR Reporting API Test Suite', () => {
    let adminToken = '';
    let managerToken = '';
    let mrToken = '';
    let mrId = '';
    let doctorId = '';
    let productId = '';
    (0, vitest_1.it)('Health Check: returns 200 OK', async () => {
        const res = await (0, supertest_1.default)(server_1.default).get('/api/v1/health');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.status).toBe('ok');
    });
    (0, vitest_1.it)('Auth: Admin login succeeds and returns tokens', async () => {
        const res = await (0, supertest_1.default)(server_1.default).post('/api/v1/auth/login').send({
            email: 'admin@pharma.com',
            password: 'password123',
        });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.accessToken).toBeDefined();
        (0, vitest_1.expect)(res.body.user.role).toBe('ADMIN');
        adminToken = res.body.accessToken;
    });
    (0, vitest_1.it)('Auth: Manager login succeeds and returns role MANAGER', async () => {
        const res = await (0, supertest_1.default)(server_1.default).post('/api/v1/auth/login').send({
            email: 'manager.north@pharma.com',
            password: 'password123',
        });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.user.role).toBe('MANAGER');
        managerToken = res.body.accessToken;
    });
    (0, vitest_1.it)('Auth: MR login succeeds and returns role MR', async () => {
        const res = await (0, supertest_1.default)(server_1.default).post('/api/v1/auth/login').send({
            email: 'mr.rahul@pharma.com',
            password: 'password123',
        });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.user.role).toBe('MR');
        mrToken = res.body.accessToken;
        mrId = res.body.user.id;
    });
    (0, vitest_1.it)('Doctors: lists doctors directory', async () => {
        const res = await (0, supertest_1.default)(server_1.default)
            .get('/api/v1/doctors')
            .set('Authorization', `Bearer ${mrToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data.length).toBeGreaterThan(0);
        doctorId = res.body.data[0].id;
    });
    (0, vitest_1.it)('Products: lists pharmaceutical products', async () => {
        const res = await (0, supertest_1.default)(server_1.default)
            .get('/api/v1/products')
            .set('Authorization', `Bearer ${mrToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data.length).toBeGreaterThan(0);
        productId = res.body.data[0].id;
    });
    (0, vitest_1.it)('MR Flow: Check-in and Checkout cycle', async () => {
        // Check-in
        const checkinRes = await (0, supertest_1.default)(server_1.default)
            .post('/api/v1/visits/checkin')
            .set('Authorization', `Bearer ${mrToken}`)
            .send({
            doctorId,
            lat: 28.5355,
            lng: 77.2910,
        });
        (0, vitest_1.expect)(checkinRes.status).toBe(201);
        const visitId = checkinRes.body.visit.id;
        // Checkout with DCR
        const checkoutRes = await (0, supertest_1.default)(server_1.default)
            .patch(`/api/v1/visits/${visitId}/checkout`)
            .set('Authorization', `Bearer ${mrToken}`)
            .send({
            productsDiscussed: [{ productId, notes: 'Detailed efficacy in clinical trials' }],
            samplesGiven: [{ productId, productName: 'CardioVas 20mg', quantity: 2 }],
            feedback: 'Doctor committed to prescribe for 5 new patients',
        });
        (0, vitest_1.expect)(checkoutRes.status).toBe(200);
        (0, vitest_1.expect)(checkoutRes.body.visit.checkOutTime).toBeDefined();
    });
    (0, vitest_1.it)('Tour Plan: MR submits weekly plan, Manager approves', async () => {
        const nextWeekStart = new Date();
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
        const submitRes = await (0, supertest_1.default)(server_1.default)
            .post('/api/v1/tour-plans')
            .set('Authorization', `Bearer ${mrToken}`)
            .send({
            weekStart: nextWeekStart.toISOString(),
            weekEnd: nextWeekEnd.toISOString(),
            planDetails: [
                { date: 'Monday', area: 'South Delhi Hospital Cluster', doctorIds: [doctorId], targetCalls: 5 },
            ],
        });
        (0, vitest_1.expect)(submitRes.status).toBe(201);
        const planId = submitRes.body.tourPlan.id;
        // Manager approves
        const approveRes = await (0, supertest_1.default)(server_1.default)
            .patch(`/api/v1/tour-plans/${planId}/approve`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({
            reviewNote: 'Looks good, territory coverage approved.',
        });
        (0, vitest_1.expect)(approveRes.status).toBe(200);
        (0, vitest_1.expect)(approveRes.body.tourPlan.status).toBe('APPROVED');
    });
    (0, vitest_1.it)('Expenses: MR submits expense, Manager approves', async () => {
        const expenseRes = await (0, supertest_1.default)(server_1.default)
            .post('/api/v1/expenses')
            .set('Authorization', `Bearer ${mrToken}`)
            .send({
            category: 'travel',
            amount: 650,
            description: 'Fuel allowance for North Delhi doctor calls',
        });
        (0, vitest_1.expect)(expenseRes.status).toBe(201);
        const expenseId = expenseRes.body.expense.id;
        const approveRes = await (0, supertest_1.default)(server_1.default)
            .patch(`/api/v1/expenses/${expenseId}/approve`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({
            reviewNote: 'Approved under policy guidelines.',
        });
        (0, vitest_1.expect)(approveRes.status).toBe(200);
        (0, vitest_1.expect)(approveRes.body.expense.status).toBe('APPROVED');
    });
    (0, vitest_1.it)('Analytics: Doctor coverage returns metrics', async () => {
        const res = await (0, supertest_1.default)(server_1.default)
            .get('/api/v1/analytics/coverage')
            .set('Authorization', `Bearer ${managerToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.summary.totalDoctors).toBeGreaterThan(0);
        (0, vitest_1.expect)(res.body.summary.coveragePercentage).toBeDefined();
    });
});
