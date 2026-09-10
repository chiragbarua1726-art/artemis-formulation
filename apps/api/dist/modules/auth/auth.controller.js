"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.googleLogin = exports.verifyEmail = exports.registerAdminUser = exports.register = exports.logout = exports.refreshToken = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const google_auth_library_1 = require("google-auth-library");
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("../../lib/prisma");
const email_service_1 = require("./email.service");
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-dev';
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new google_auth_library_1.OAuth2Client(googleClientId) : null;
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    role: zod_1.z.enum(['ADMIN', 'MANAGER', 'MR']).optional(),
    phone: zod_1.z.string().optional(),
    region: zod_1.z.string().optional(),
    managerId: zod_1.z.string().optional().nullable(),
});
const googleSchema = zod_1.z.object({ credential: zod_1.z.string().min(20) });
function userResponse(user) {
    return {
        id: user.id, name: user.name, email: user.email, role: user.role,
        phone: user.phone, region: user.region, managerId: user.managerId, manager: user.manager,
    };
}
function generateTokens(user) {
    const accessToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    const refreshToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}
const login = async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma_1.prisma.user.findUnique({
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
    if (!user.emailVerified) {
        return res.status(403).json({ error: 'Please confirm your email address before signing in' });
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    const tokens = generateTokens(user);
    res.json({ ...tokens, user: userResponse(user) });
};
exports.login = login;
const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, active: true },
        });
        if (!user || !user.active) {
            return res.status(401).json({ error: 'User is inactive or not found' });
        }
        const tokens = generateTokens(user);
        res.json(tokens);
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
};
exports.refreshToken = refreshToken;
const logout = async (_req, res) => {
    res.json({ message: 'Successfully logged out' });
};
exports.logout = logout;
const register = async (req, res) => {
    const data = registerSchema.parse(req.body);
    const existing = await prisma_1.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
    });
    if (existing) {
        return res.status(409).json({ error: 'A user with this email already exists' });
    }
    const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
    const verification = (0, email_service_1.createVerificationToken)();
    const user = await prisma_1.prisma.user.create({
        data: {
            name: data.name,
            email: data.email.toLowerCase(),
            passwordHash,
            role: req.user ? (data.role || 'MR') : 'MR',
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
    await (0, email_service_1.sendVerificationEmail)(user.email, user.name, verification.token);
    res.status(201).json({ user, message: 'Account created. Check your email to confirm your account.' });
};
exports.register = register;
exports.registerAdminUser = exports.register;
const verifyEmail = async (req, res) => {
    const token = zod_1.z.string().min(20).parse(req.query.token);
    const user = await prisma_1.prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user || !user.verificationExpires || user.verificationExpires < new Date()) {
        return res.status(400).json({ error: 'This confirmation link is invalid or expired' });
    }
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, verificationToken: null, verificationExpires: null },
    });
    res.json({ message: 'Email confirmed successfully. You can now sign in.' });
};
exports.verifyEmail = verifyEmail;
const googleLogin = async (req, res) => {
    if (!googleClient || !googleClientId) {
        return res.status(503).json({ error: 'Google sign-in is not configured' });
    }
    const { credential } = googleSchema.parse(req.body);
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) {
        return res.status(401).json({ error: 'Google account could not be verified' });
    }
    let user = await prisma_1.prisma.user.findFirst({
        where: { OR: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }] },
        include: { manager: { select: { id: true, name: true, email: true, region: true } } },
    });
    if (user) {
        if (!user.active)
            return res.status(403).json({ error: 'This account is inactive' });
        if (!user.googleId) {
            user = await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { googleId: payload.sub },
                include: { manager: { select: { id: true, name: true, email: true, region: true } } },
            });
        }
    }
    else {
        user = await prisma_1.prisma.user.create({
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
exports.googleLogin = googleLogin;
const getMe = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await prisma_1.prisma.user.findUnique({
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
exports.getMe = getMe;
