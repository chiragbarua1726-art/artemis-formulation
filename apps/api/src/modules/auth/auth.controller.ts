import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createVerificationToken, sendPasswordResetEmail, sendVerificationEmail } from './email.service';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-dev';
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['MR', 'MANAGER']).default('MR'),
  managerCode: z.string().optional(),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['MANAGER', 'MR']).default('MR'),
  managerCode: z.string().optional(),
  phone: z.string().optional(),
  region: z.string().optional(),
  managerId: z.string().optional().nullable(),
});

const googleSchema = z.object({ credential: z.string().min(20) });
const forgotPasswordSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({ token: z.string().min(20), password: z.string().min(8) });

function userResponse(user: any) {
  return {
    id: user.id, name: user.name, email: user.email, role: user.role,
    phone: user.phone, region: user.region, managerId: user.managerId, manager: user.manager,
  };
}

function generateTokens(user: { id: string; email: string; role: string }) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

export const login = async (req: Request, res: Response) => {
  const { email, password, role, managerCode } = loginSchema.parse(req.body);

  if (role === 'MANAGER' && (!process.env.MANAGER_ACCESS_CODE || managerCode !== process.env.MANAGER_ACCESS_CODE)) {
    return res.status(401).json({ error: 'A valid manager access code is required' });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      manager: {
        select: { id: true, name: true, email: true, region: true },
      },
    },
  });

  if (!user || !user.active || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (role === 'MR' && user.role !== 'MR') {
    return res.status(403).json({ error: 'Select the Manager / Admin login option for this account' });
  }
  if (role === 'MANAGER' && !['MANAGER', 'ADMIN'].includes(user.role)) {
    return res.status(403).json({ error: 'This account is not authorized for manager sign-in' });
  }
  if (!user.emailVerified) {
    return res.status(403).json({ error: 'Please confirm your email address before signing in' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const tokens = generateTokens(user);

  res.json({ ...tokens, user: userResponse(user) });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, active: true },
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'User is inactive or not found' });
    }

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.json({ message: 'Successfully logged out' });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (user) {
    const token = createVerificationToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: token.token, resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000) },
    });
    try {
      await sendPasswordResetEmail(user.email, user.name, token.token);
    } catch (error) {
      console.error('Password reset email delivery failed:', error);
      return res.status(503).json({ error: 'Email delivery is temporarily unavailable. Please try again later.' });
    }
  }
  return res.json({ message: 'If an account exists for that email, a password reset link has been sent.' });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = resetPasswordSchema.parse(req.body);
  const user = await prisma.user.findFirst({
    where: { resetPasswordToken: token, resetPasswordExpires: { gt: new Date() } },
  });
  if (!user) return res.status(400).json({ error: 'This password reset link is invalid or expired' });
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 12), resetPasswordToken: null, resetPasswordExpires: null },
  });
  return res.json({ message: 'Password reset successfully. You can now sign in.' });
};

export const register = async (req: AuthenticatedRequest, res: Response) => {
  const data = registerSchema.parse(req.body);
  const isAdminRegistration = req.user?.role === 'ADMIN';
  if (data.role === 'MANAGER' && (!isAdminRegistration && (!process.env.MANAGER_ACCESS_CODE || data.managerCode !== process.env.MANAGER_ACCESS_CODE))) {
    return res.status(403).json({ error: 'A valid manager access code is required to register as a manager' });
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const verification = createVerificationToken();

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: isAdminRegistration ? data.role : data.role,
      phone: data.phone,
      region: data.region,
      managerId: data.managerId || null,
      active: true,
      emailVerified: Boolean(req.user),
      verificationToken: verification.token,
      verificationExpires: verification.expires,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      region: true,
      managerId: true,
      createdAt: true,
    },
  });

  try {
    await sendVerificationEmail(user.email, user.name, verification.token);
  } catch (error) {
    console.error('Account verification email delivery failed:', error);
    return res.status(503).json({ error: 'Email delivery is temporarily unavailable. Please try again later.' });
  }
  res.status(201).json({ user, message: 'Account created. Check your email to confirm your account.' });
};

export const registerAdminUser = register;

export const verifyEmail = async (req: Request, res: Response) => {
  const token = z.string().min(20).parse(req.query.token);
  const user = await prisma.user.findFirst({ where: { verificationToken: token } });
  if (!user || !user.verificationExpires || user.verificationExpires < new Date()) {
    return res.status(400).json({ error: 'This confirmation link is invalid or expired' });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null, verificationExpires: null },
  });
  res.json({ message: 'Email confirmed successfully. You can now sign in.' });
};

export const googleLogin = async (req: Request, res: Response) => {
  if (!googleClient || !googleClientId) {
    return res.status(503).json({ error: 'Google sign-in is not configured' });
  }

  const { credential } = googleSchema.parse(req.body);
  const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || !payload.email_verified) {
    return res.status(401).json({ error: 'Google account could not be verified' });
  }

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }] },
    include: { manager: { select: { id: true, name: true, email: true, region: true } } },
  });

  if (user) {
    if (!user.active) return res.status(403).json({ error: 'This account is inactive' });
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub },
        include: { manager: { select: { id: true, name: true, email: true, region: true } } },
      });
    }
  } else {
    user = await prisma.user.create({
      data: {
        name: payload.name || payload.email.split('@')[0],
        email: payload.email.toLowerCase(),
        googleId: payload.sub,
        role: 'MR',
        active: true,
        emailVerified: true,
      },
      include: { manager: { select: { id: true, name: true, email: true, region: true } } },
    });
  }

  res.json({ ...generateTokens(user), user: userResponse(user) });
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      manager: {
        select: { id: true, name: true, email: true, region: true },
      },
      reports: {
        where: { active: true },
        select: { id: true, name: true, email: true, region: true, phone: true },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      region: user.region,
      managerId: user.managerId,
      manager: user.manager,
      reports: user.reports,
    },
  });
};
