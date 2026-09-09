import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getMyVisits,
  getActiveVisit,
  getAllVisits,
} from './visits.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/checkin', checkIn);
router.patch('/:id/checkout', checkOut);
router.get('/me', getMyVisits);
router.get('/active', getActiveVisit);
router.get('/', requireRole(['ADMIN', 'MANAGER']), getAllVisits);

export default router;
