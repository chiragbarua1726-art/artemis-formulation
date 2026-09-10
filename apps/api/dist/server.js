"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const visits_routes_1 = __importDefault(require("./modules/visits/visits.routes"));
const tourPlans_routes_1 = __importDefault(require("./modules/tourPlans/tourPlans.routes"));
const expenses_routes_1 = __importDefault(require("./modules/expenses/expenses.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const team_routes_1 = __importDefault(require("./modules/team/team.routes"));
const masterData_routes_1 = __importDefault(require("./modules/masterData/masterData.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
dotenv_1.default.config();
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be configured in production');
}
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((0, helmet_1.default)());
app.use('/api/v1/auth', (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true }));
// CORS configuration
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.CORS_ORIGIN || 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check
app.get('/api/v1/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'MR Reporting System API',
        timestamp: new Date().toISOString(),
    });
});
// API Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/visits', visits_routes_1.default);
app.use('/api/v1/tour-plans', tourPlans_routes_1.default);
app.use('/api/v1/expenses', expenses_routes_1.default);
app.use('/api/v1/analytics', analytics_routes_1.default);
app.use('/api/v1/team', team_routes_1.default);
app.use('/api/v1', masterData_routes_1.default);
// Global Error Handler
app.use(errorHandler_1.errorHandler);
// Only listen if not imported by test runner
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, async () => {
        console.log(`🚀 Aegis MR API Server running on port ${PORT}`);
        console.log(`📍 Health check: http://localhost:${PORT}/api/v1/health`);
        const { ensureDefaultAccounts } = await Promise.resolve().then(() => __importStar(require('./lib/initAccounts')));
        await ensureDefaultAccounts();
    });
}
exports.default = app;
