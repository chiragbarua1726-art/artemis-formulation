"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllVisits = exports.getActiveVisit = exports.getMyVisits = exports.checkOut = exports.checkIn = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const checkInSchema = zod_1.z.object({
    doctorId: zod_1.z.string().uuid('Invalid doctor ID'),
    lat: zod_1.z.number().min(-90).max(90),
    lng: zod_1.z.number().min(-180).max(180),
});
const checkoutSchema = zod_1.z.object({
    productsDiscussed: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().uuid().optional(),
        productName: zod_1.z.string().min(2).optional(),
        notes: zod_1.z.string().optional(),
        quantity: zod_1.z.number().int().min(0).optional(),
        value: zod_1.z.number().min(0).optional(),
    })).optional().default([]),
    samplesGiven: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().uuid().optional(),
        productName: zod_1.z.string(),
        quantity: zod_1.z.number().int().min(1),
        value: zod_1.z.number().min(0).optional(),
    })).optional(),
    feedback: zod_1.z.string().optional(),
    photoUrl: zod_1.z.string().optional().nullable(),
});
const checkIn = async (req, res) => {
    const mrId = req.user.id;
    const { doctorId, lat, lng } = checkInSchema.parse(req.body);
    // Verify doctor exists
    const doctor = await prisma_1.prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
    }
    // Check if there is already an active (un-checked-out) visit
    const existingActive = await prisma_1.prisma.visit.findFirst({
        where: {
            mrId,
            checkOutTime: null,
        },
        include: { doctor: true },
    });
    if (existingActive) {
        return res.status(400).json({
            error: 'You already have an active visit in progress. Please check out before starting a new visit.',
            activeVisit: existingActive,
        });
    }
    const visit = await prisma_1.prisma.visit.create({
        data: {
            mrId,
            doctorId,
            checkInLat: lat,
            checkInLng: lng,
            checkInTime: new Date(),
        },
        include: {
            doctor: true,
        },
    });
    res.status(201).json({
        message: `Checked in successfully at ${doctor.name}'s clinic`,
        visit,
    });
};
exports.checkIn = checkIn;
const checkOut = async (req, res) => {
    const { id } = req.params;
    const mrId = req.user.id;
    const { productsDiscussed, samplesGiven, feedback, photoUrl } = checkoutSchema.parse(req.body);
    const visit = await prisma_1.prisma.visit.findUnique({
        where: { id },
        include: { doctor: true },
    });
    if (!visit) {
        return res.status(404).json({ error: 'Visit record not found' });
    }
    // rep can only checkout their own visit, unless admin
    if (visit.mrId !== mrId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: You can only check out your own visit' });
    }
    if (visit.checkOutTime) {
        return res.status(400).json({ error: 'This visit has already been checked out' });
    }
    // Record product discussions if provided
    if (productsDiscussed && productsDiscussed.length > 0) {
        for (const pd of productsDiscussed) {
            let productId = pd.productId;
            if (!productId && pd.productName) {
                const product = await prisma_1.prisma.product.create({
                    data: {
                        name: pd.productName,
                        sku: `MR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        unitPrice: pd.value ?? 0,
                        active: true,
                    },
                });
                productId = product.id;
            }
            if (!productId)
                continue;
            await prisma_1.prisma.productDiscussion.create({
                data: {
                    visitId: visit.id,
                    productId,
                    notes: pd.notes || null,
                    quantity: pd.quantity ?? null,
                    value: pd.value ?? null,
                },
            });
        }
    }
    const updatedVisit = await prisma_1.prisma.visit.update({
        where: { id },
        data: {
            checkOutTime: new Date(),
            feedback: feedback || null,
            photoUrl: photoUrl || null,
            samplesGiven: samplesGiven ? JSON.stringify(samplesGiven) : null,
        },
        include: {
            doctor: true,
            productsDiscussed: {
                include: { product: true },
            },
        },
    });
    res.json({
        message: 'Daily Call Report submitted and checked out successfully',
        visit: {
            ...updatedVisit,
            samplesGiven: updatedVisit.samplesGiven ? JSON.parse(updatedVisit.samplesGiven) : [],
        },
    });
};
exports.checkOut = checkOut;
const getMyVisits = async (req, res) => {
    const mrId = req.user.id;
    const { from, to, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const whereClause = { mrId };
    if (from || to) {
        whereClause.checkInTime = {};
        if (from)
            whereClause.checkInTime.gte = new Date(from);
        if (to)
            whereClause.checkInTime.lte = new Date(to);
    }
    const [total, rawVisits] = await Promise.all([
        prisma_1.prisma.visit.count({ where: whereClause }),
        prisma_1.prisma.visit.findMany({
            where: whereClause,
            skip,
            take: limitNum,
            orderBy: { checkInTime: 'desc' },
            include: {
                doctor: true,
                productsDiscussed: {
                    include: { product: true },
                },
            },
        }),
    ]);
    const visits = rawVisits.map((v) => ({
        ...v,
        samplesGiven: v.samplesGiven ? JSON.parse(v.samplesGiven) : [],
    }));
    res.json({
        data: visits,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
};
exports.getMyVisits = getMyVisits;
const getActiveVisit = async (req, res) => {
    const mrId = req.user.id;
    const active = await prisma_1.prisma.visit.findFirst({
        where: {
            mrId,
            checkOutTime: null,
        },
        include: {
            doctor: true,
            productsDiscussed: {
                include: { product: true },
            },
        },
    });
    if (!active) {
        return res.json({ activeVisit: null });
    }
    res.json({
        activeVisit: {
            ...active,
            samplesGiven: active.samplesGiven ? JSON.parse(active.samplesGiven) : [],
        },
    });
};
exports.getActiveVisit = getActiveVisit;
const getAllVisits = async (req, res) => {
    const { mrId, doctorId, from, to, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const whereClause = {};
    if (mrId)
        whereClause.mrId = mrId;
    if (doctorId)
        whereClause.doctorId = doctorId;
    // If manager, restrict to their team members
    if (req.user.role === 'MANAGER') {
        const teamMembers = await prisma_1.prisma.user.findMany({
            where: { managerId: req.user.id },
            select: { id: true },
        });
        const teamIds = teamMembers.map((m) => m.id);
        whereClause.mrId = mrId ? (teamIds.includes(mrId) ? mrId : '__NONE__') : { in: teamIds };
    }
    if (from || to) {
        whereClause.checkInTime = {};
        if (from)
            whereClause.checkInTime.gte = new Date(from);
        if (to)
            whereClause.checkInTime.lte = new Date(to);
    }
    const [total, rawVisits] = await Promise.all([
        prisma_1.prisma.visit.count({ where: whereClause }),
        prisma_1.prisma.visit.findMany({
            where: whereClause,
            skip,
            take: limitNum,
            orderBy: { checkInTime: 'desc' },
            include: {
                mr: {
                    select: { id: true, name: true, email: true, region: true },
                },
                doctor: true,
                productsDiscussed: {
                    include: { product: true },
                },
            },
        }),
    ]);
    const visits = rawVisits.map((v) => ({
        ...v,
        samplesGiven: v.samplesGiven ? JSON.parse(v.samplesGiven) : [],
    }));
    res.json({
        data: visits,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
};
exports.getAllVisits = getAllVisits;
