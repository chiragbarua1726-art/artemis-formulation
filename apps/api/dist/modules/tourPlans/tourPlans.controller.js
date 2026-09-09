"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectTourPlan = exports.approveTourPlan = exports.getAllTourPlans = exports.getMyTourPlans = exports.createTourPlan = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const createTourPlanSchema = zod_1.z.object({
    weekStart: zod_1.z.string().datetime(),
    weekEnd: zod_1.z.string().datetime(),
    planDetails: zod_1.z.array(zod_1.z.object({
        date: zod_1.z.string(),
        area: zod_1.z.string(),
        doctorIds: zod_1.z.array(zod_1.z.string()).default([]),
        targetCalls: zod_1.z.number().optional().default(5),
        notes: zod_1.z.string().optional(),
    })),
});
const reviewSchema = zod_1.z.object({
    reviewNote: zod_1.z.string().min(2, 'Review note is required'),
});
const createTourPlan = async (req, res) => {
    const mrId = req.user.id;
    const { weekStart, weekEnd, planDetails } = createTourPlanSchema.parse(req.body);
    const plan = await prisma_1.prisma.tourPlan.create({
        data: {
            mrId,
            weekStart: new Date(weekStart),
            weekEnd: new Date(weekEnd),
            planDetails: JSON.stringify(planDetails),
            status: 'PENDING',
        },
        include: {
            mr: {
                select: { id: true, name: true, email: true, region: true },
            },
        },
    });
    res.status(201).json({
        message: 'Weekly tour plan submitted successfully for manager approval',
        tourPlan: {
            ...plan,
            planDetails: JSON.parse(plan.planDetails),
        },
    });
};
exports.createTourPlan = createTourPlan;
const getMyTourPlans = async (req, res) => {
    const mrId = req.user.id;
    const rawPlans = await prisma_1.prisma.tourPlan.findMany({
        where: { mrId },
        orderBy: { weekStart: 'desc' },
    });
    const plans = rawPlans.map((p) => ({
        ...p,
        planDetails: JSON.parse(p.planDetails),
    }));
    res.json({ data: plans });
};
exports.getMyTourPlans = getMyTourPlans;
const getAllTourPlans = async (req, res) => {
    const { status, mrId, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const whereClause = {};
    if (status)
        whereClause.status = status;
    if (mrId)
        whereClause.mrId = mrId;
    // Manager filter: only MRs reporting to this manager
    if (req.user.role === 'MANAGER') {
        const team = await prisma_1.prisma.user.findMany({
            where: { managerId: req.user.id },
            select: { id: true },
        });
        const teamIds = team.map((m) => m.id);
        whereClause.mrId = mrId ? (teamIds.includes(mrId) ? mrId : '__NONE__') : { in: teamIds };
    }
    const [total, rawPlans] = await Promise.all([
        prisma_1.prisma.tourPlan.count({ where: whereClause }),
        prisma_1.prisma.tourPlan.findMany({
            where: whereClause,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            include: {
                mr: {
                    select: { id: true, name: true, email: true, region: true, phone: true },
                },
            },
        }),
    ]);
    const plans = rawPlans.map((p) => ({
        ...p,
        planDetails: JSON.parse(p.planDetails),
    }));
    res.json({
        data: plans,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
};
exports.getAllTourPlans = getAllTourPlans;
const approveTourPlan = async (req, res) => {
    const { id } = req.params;
    const { reviewNote } = reviewSchema.parse(req.body);
    const plan = await prisma_1.prisma.tourPlan.findUnique({
        where: { id },
        include: { mr: true },
    });
    if (!plan) {
        return res.status(404).json({ error: 'Tour plan not found' });
    }
    const updated = await prisma_1.prisma.tourPlan.update({
        where: { id },
        data: {
            status: 'APPROVED',
            reviewedBy: req.user.name,
            reviewNote,
            reviewedAt: new Date(),
        },
        include: {
            mr: { select: { id: true, name: true, email: true } },
        },
    });
    res.json({
        message: 'Tour plan approved successfully',
        tourPlan: {
            ...updated,
            planDetails: JSON.parse(updated.planDetails),
        },
    });
};
exports.approveTourPlan = approveTourPlan;
const rejectTourPlan = async (req, res) => {
    const { id } = req.params;
    const { reviewNote } = reviewSchema.parse(req.body);
    const plan = await prisma_1.prisma.tourPlan.findUnique({ where: { id } });
    if (!plan) {
        return res.status(404).json({ error: 'Tour plan not found' });
    }
    const updated = await prisma_1.prisma.tourPlan.update({
        where: { id },
        data: {
            status: 'REJECTED',
            reviewedBy: req.user.name,
            reviewNote,
            reviewedAt: new Date(),
        },
        include: {
            mr: { select: { id: true, name: true, email: true } },
        },
    });
    res.json({
        message: 'Tour plan rejected with feedback',
        tourPlan: {
            ...updated,
            planDetails: JSON.parse(updated.planDetails),
        },
    });
};
exports.rejectTourPlan = rejectTourPlan;
