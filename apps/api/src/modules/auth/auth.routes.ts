import { Router } from 'express';
import { login, refreshToken, logout, register, registerAdminUser, googleLogin, getMe, verifyEmail, forgotPassword, resetPassword } from './auth.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);
// Public sign-up creates an MR account. Elevated roles remain admin-controlled.
router.post('/register', register);
router.post('/google', googleLogin);
router.get('/verify-email', verifyEmail);
router.post('/admin/register', authenticate, requireRole(['ADMIN']), registerAdminUser);

export default router;
