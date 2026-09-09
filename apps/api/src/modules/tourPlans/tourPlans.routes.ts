import { Router } from 'express';
import {
  createTourPlan,
  getMyTourPlans,
  getAllTourPlans,
  approveTourPlan,
  rejectTourPlan,
} from './tourPlans.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createTourPlan);
router.get('/me', getMyTourPlans);
router.get('/', requireRole(['ADMIN', 'MANAGER']), getAllTourPlans);
router.patch('/:id/approve', requireRole(['ADMIN', 'MANAGER']), approveTourPlan);
router.patch('/:id/reject', requireRole(['ADMIN', 'MANAGER']), rejectTourPlan);

export default router;
