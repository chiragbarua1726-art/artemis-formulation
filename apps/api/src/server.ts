import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import visitsRoutes from './modules/visits/visits.routes';
import tourPlansRoutes from './modules/tourPlans/tourPlans.routes';
import expensesRoutes from './modules/expenses/expenses.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import teamRoutes from './modules/team/team.routes';
import masterDataRoutes from './modules/masterData/masterData.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.CORS_ORIGIN || 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'MR Reporting System API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/visits', visitsRoutes);
app.use('/api/v1/tour-plans', tourPlansRoutes);
app.use('/api/v1/expenses', expensesRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1', masterDataRoutes);

// Global Error Handler
app.use(errorHandler);

// Only listen if not imported by test runner
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Aegis MR API Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/v1/health`);
  });
}

export default app;
