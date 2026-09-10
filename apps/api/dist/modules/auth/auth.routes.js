"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.post('/login', auth_controller_1.login);
router.post('/refresh', auth_controller_1.refreshToken);
router.post('/logout', auth_controller_1.logout);
router.get('/me', auth_1.authenticate, auth_controller_1.getMe);
// Public sign-up creates an MR account. Elevated roles remain admin-controlled.
router.post('/register', auth_controller_1.register);
router.post('/google', auth_controller_1.googleLogin);
router.get('/verify-email', auth_controller_1.verifyEmail);
router.post('/admin/register', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), auth_controller_1.registerAdminUser);
exports.default = router;
