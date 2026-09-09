import { Router } from 'express';
import { login, refreshToken, logout, register, getMe } from './auth.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/register', authenticate, requireRole(['ADMIN']), register);

export default router;
