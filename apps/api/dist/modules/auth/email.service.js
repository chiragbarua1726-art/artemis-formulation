"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVerificationToken = createVerificationToken;
exports.sendVerificationEmail = sendVerificationEmail;
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const appUrl = process.env.APP_URL || 'http://localhost:5173';
function createVerificationToken() {
    return {
        token: crypto_1.default.randomBytes(32).toString('hex'),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
}
async function sendVerificationEmail(email, name, token) {
    const verificationUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.info(`[email] Confirmation link for ${email}: ${verificationUrl}`);
        return;
    }
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Confirm your Artemis account',
        text: `Hi ${name}, confirm your Artemis account: ${verificationUrl}`,
        html: `<p>Hi ${name},</p><p>Confirm your Artemis account to start using the field reporting workspace.</p><p><a href="${verificationUrl}">Confirm email address</a></p><p>This link expires in 24 hours.</p>`,
    });
}
