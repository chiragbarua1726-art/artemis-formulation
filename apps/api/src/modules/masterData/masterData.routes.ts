import { Router } from 'express';
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getUsers,
  updateUser,
  approveDoctor,
  rejectDoctor,
  previewDoctorImport,
  confirmDoctorImport,
} from './masterData.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Doctors: Accessible for selection by all authenticated users; mutating is Admin only
router.get('/doctors', getDoctors);
router.post('/doctors', requireRole(['ADMIN', 'MANAGER', 'MR']), createDoctor);
router.post('/doctors/import/preview', requireRole(['ADMIN', 'MANAGER', 'MR']), previewDoctorImport);
router.post('/doctors/import/confirm', requireRole(['ADMIN', 'MANAGER', 'MR']), confirmDoctorImport);
router.patch('/doctors/:id/approve', requireRole(['ADMIN', 'MANAGER']), approveDoctor);
router.patch('/doctors/:id/reject', requireRole(['ADMIN', 'MANAGER']), rejectDoctor);
router.put('/doctors/:id', requireRole(['ADMIN']), updateDoctor);
router.delete('/doctors/:id', requireRole(['ADMIN']), deleteDoctor);

// Products: Accessible for selection by all authenticated users; mutating is Admin only
router.get('/products', getProducts);
router.post('/products', requireRole(['ADMIN']), createProduct);
router.put('/products/:id', requireRole(['ADMIN']), updateProduct);
router.delete('/products/:id', requireRole(['ADMIN']), deleteProduct);

// Users: Admin only
router.get('/users', requireRole(['ADMIN']), getUsers);
router.put('/users/:id', requireRole(['ADMIN']), updateUser);

export default router;
