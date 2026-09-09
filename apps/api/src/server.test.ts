import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from './server';

describe('Aegis MR Reporting API Test Suite', () => {
  let adminToken = '';
  let managerToken = '';
  let mrToken = '';
  let mrId = '';
  let doctorId = '';
  let productId = '';

  it('Health Check: returns 200 OK', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('Auth: Admin login succeeds and returns tokens', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@pharma.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.role).toBe('ADMIN');
    adminToken = res.body.accessToken;
  });

  it('Auth: Manager login succeeds and returns role MANAGER', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'manager.north@pharma.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('MANAGER');
    managerToken = res.body.accessToken;
  });

  it('Auth: MR login succeeds and returns role MR', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'mr.rahul@pharma.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('MR');
    mrToken = res.body.accessToken;
    mrId = res.body.user.id;
  });

  it('Doctors: lists doctors directory', async () => {
    const res = await request(app)
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${mrToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    doctorId = res.body.data[0].id;
  });

  it('Products: lists pharmaceutical products', async () => {
    const res = await request(app)
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${mrToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    productId = res.body.data[0].id;
  });

  it('MR Flow: Check-in and Checkout cycle', async () => {
    // Check-in
    const checkinRes = await request(app)
      .post('/api/v1/visits/checkin')
      .set('Authorization', `Bearer ${mrToken}`)
      .send({
        doctorId,
        lat: 28.5355,
        lng: 77.2910,
      });
    expect(checkinRes.status).toBe(201);
    const visitId = checkinRes.body.visit.id;

    // Checkout with DCR
    const checkoutRes = await request(app)
      .patch(`/api/v1/visits/${visitId}/checkout`)
      .set('Authorization', `Bearer ${mrToken}`)
      .send({
        productsDiscussed: [{ productId, notes: 'Detailed efficacy in clinical trials' }],
        samplesGiven: [{ productId, productName: 'CardioVas 20mg', quantity: 2 }],
        feedback: 'Doctor committed to prescribe for 5 new patients',
      });
    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body.visit.checkOutTime).toBeDefined();
  });

  it('Tour Plan: MR submits weekly plan, Manager approves', async () => {
    const nextWeekStart = new Date();
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);

    const submitRes = await request(app)
      .post('/api/v1/tour-plans')
      .set('Authorization', `Bearer ${mrToken}`)
      .send({
        weekStart: nextWeekStart.toISOString(),
        weekEnd: nextWeekEnd.toISOString(),
        planDetails: [
          { date: 'Monday', area: 'South Delhi Hospital Cluster', doctorIds: [doctorId], targetCalls: 5 },
        ],
      });
    expect(submitRes.status).toBe(201);
    const planId = submitRes.body.tourPlan.id;

    // Manager approves
    const approveRes = await request(app)
      .patch(`/api/v1/tour-plans/${planId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        reviewNote: 'Looks good, territory coverage approved.',
      });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.tourPlan.status).toBe('APPROVED');
  });

  it('Expenses: MR submits expense, Manager approves', async () => {
    const expenseRes = await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${mrToken}`)
      .send({
        category: 'travel',
        amount: 650,
        description: 'Fuel allowance for North Delhi doctor calls',
      });
    expect(expenseRes.status).toBe(201);
    const expenseId = expenseRes.body.expense.id;

    const approveRes = await request(app)
      .patch(`/api/v1/expenses/${expenseId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        reviewNote: 'Approved under policy guidelines.',
      });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.expense.status).toBe('APPROVED');
  });

  it('Analytics: Doctor coverage returns metrics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/coverage')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.summary.totalDoctors).toBeGreaterThan(0);
    expect(res.body.summary.coveragePercentage).toBeDefined();
  });
});
