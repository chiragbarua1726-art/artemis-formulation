"use strict";
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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
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
    app.listen(PORT, () => {
        console.log(`🚀 Aegis MR API Server running on port ${PORT}`);
        console.log(`📍 Health check: http://localhost:${PORT}/api/v1/health`);
    });
}
exports.default = app;
