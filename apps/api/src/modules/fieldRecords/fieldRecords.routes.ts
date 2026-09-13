import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import {
  approveChemist,
  approveOrder,
  createChemist,
  createOrder,
  getChemists,
  getOrders,
  rejectChemist,
  rejectOrder,
  previewChemistImport,
  previewOrderImport,
  confirmChemistImport,
  confirmOrderImport,
} from './fieldRecords.controller';

const router = Router();
router.use(authenticate);

router.get('/chemists', getChemists);
router.post('/chemists', requireRole(['ADMIN', 'MANAGER', 'MR']), createChemist);
router.post('/chemists/import/preview', requireRole(['ADMIN', 'MANAGER', 'MR']), previewChemistImport);
router.post('/chemists/import/confirm', requireRole(['ADMIN', 'MANAGER', 'MR']), confirmChemistImport);
router.patch('/chemists/:id/approve', requireRole(['ADMIN', 'MANAGER']), approveChemist);
router.patch('/chemists/:id/reject', requireRole(['ADMIN', 'MANAGER']), rejectChemist);

router.get(['/orders', '/pov-orders'], getOrders);
router.post(['/orders', '/pov-orders'], requireRole(['ADMIN', 'MANAGER', 'MR']), createOrder);
router.post(['/orders/import/preview', '/pov-orders/import/preview'], requireRole(['ADMIN', 'MANAGER', 'MR']), previewOrderImport);
router.post(['/orders/import/confirm', '/pov-orders/import/confirm'], requireRole(['ADMIN', 'MANAGER', 'MR']), confirmOrderImport);
router.patch(['/orders/:id/approve', '/pov-orders/:id/approve'], requireRole(['ADMIN', 'MANAGER']), approveOrder);
router.patch(['/orders/:id/reject', '/pov-orders/:id/reject'], requireRole(['ADMIN', 'MANAGER']), rejectOrder);

export default router;
