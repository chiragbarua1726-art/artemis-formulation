import { Router } from 'express';
import {
  createExpense,
  getMyExpenses,
  getAllExpenses,
  approveExpense,
  rejectExpense,
} from './expenses.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createExpense);
router.get('/me', getMyExpenses);
router.get('/', requireRole(['ADMIN', 'MANAGER']), getAllExpenses);
router.patch('/:id/approve', requireRole(['ADMIN', 'MANAGER']), approveExpense);
router.patch('/:id/reject', requireRole(['ADMIN', 'MANAGER']), rejectExpense);

export default router;
