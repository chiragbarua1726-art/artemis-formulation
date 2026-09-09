import { Router } from 'express';
import {
  getDoctorCoverage,
  getSampleDistribution,
  getTeamPerformance,
  getMrDashboard,
} from './analytics.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// MR self dashboard
router.get('/me', getMrDashboard);

// Manager / Admin analytics
router.get('/coverage', requireRole(['ADMIN', 'MANAGER']), getDoctorCoverage);
router.get('/samples', requireRole(['ADMIN', 'MANAGER']), getSampleDistribution);
router.get('/team-performance', requireRole(['ADMIN', 'MANAGER']), getTeamPerformance);

export default router;
