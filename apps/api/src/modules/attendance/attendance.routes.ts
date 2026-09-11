import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import {
  approveAttendance,
  checkOutAttendance,
  createAttendance,
  getMyAttendance,
  getTeamAttendance,
  rejectAttendance,
} from './attendance.controller';

const router = Router();
router.use(authenticate);

router.post(['/', '/check-in'], createAttendance);
router.get(['/me', '/reports/me'], getMyAttendance);
router.get(['/','/reports'], requireRole(['ADMIN', 'MANAGER']), getTeamAttendance);
router.patch('/:id/check-out', checkOutAttendance);
router.patch('/:id/approve', requireRole(['ADMIN', 'MANAGER']), approveAttendance);
router.patch('/:id/reject', requireRole(['ADMIN', 'MANAGER']), rejectAttendance);

export default router;

