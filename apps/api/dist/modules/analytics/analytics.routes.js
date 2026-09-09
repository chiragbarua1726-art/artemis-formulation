"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// MR self dashboard
router.get('/me', analytics_controller_1.getMrDashboard);
// Manager / Admin analytics
router.get('/coverage', (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), analytics_controller_1.getDoctorCoverage);
router.get('/samples', (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), analytics_controller_1.getSampleDistribution);
router.get('/team-performance', (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), analytics_controller_1.getTeamPerformance);
exports.default = router;
