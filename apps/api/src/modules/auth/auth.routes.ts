import { Router } from 'express';
import { login, refreshToken, logout, register, registerAdminUser, googleLogin, getMe, verifyEmail, forgotPassword, resetPassword } from './auth.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = Router();

router.post('/login', asyncHandler(login));
router.post('/refresh', asyncHandler(refreshToken));
router.post('/logout', asyncHandler(logout));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));
router.get('/me', authenticate, asyncHandler(getMe));
// Public sign-up creates an MR account. Elevated roles remain admin-controlled.
router.post('/register', asyncHandler(register));
router.post('/google', asyncHandler(googleLogin));
router.get('/verify-email', asyncHandler(verifyEmail));
router.post('/admin/register', authenticate, requireRole(['ADMIN']), asyncHandler(registerAdminUser));

export default router;
