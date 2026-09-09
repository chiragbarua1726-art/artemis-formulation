"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMrDetail = exports.getTeamTracker = void 0;
const prisma_1 = require("../../lib/prisma");
const getTeamTracker = async (req, res) => {
    let whereClause = { role: 'MR', active: true };
    if (req.user.role === 'MANAGER') {
        whereClause.managerId = req.user.id;
    }
    const team = await prisma_1.prisma.user.findMany({
        where: whereClause,
        include: {
            manager: {
                select: { id: true, name: true },
            },
            visits: {
                orderBy: { checkInTime: 'desc' },
                take: 1,
                include: {
                    doctor: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    });
    // Calculate live-ish tracking stats
    const trackerData = team.map((mr) => {
        const latestVisit = mr.visits[0] || null;
        const isCurrentlyInCall = latestVisit ? latestVisit.checkOutTime === null : false;
        return {
            id: mr.id,
            name: mr.name,
            email: mr.email,
            phone: mr.phone,
            region: mr.region,
            managerName: mr.manager?.name || 'Unassigned',
            isCurrentlyInCall,
            latestVisit: latestVisit
                ? {
                    id: latestVisit.id,
                    doctorName: latestVisit.doctor.name,
                    hospitalName: latestVisit.doctor.hospitalName,
                    address: latestVisit.doctor.address,
                    checkInTime: latestVisit.checkInTime,
                    checkOutTime: latestVisit.checkOutTime,
                    latitude: latestVisit.checkInLat,
                    longitude: latestVisit.checkInLng,
                }
                : null,
        };
    });
    res.json({ data: trackerData });
};
exports.getTeamTracker = getTeamTracker;
const getMrDetail = async (req, res) => {
    const { id } = req.params;
    const mr = await prisma_1.prisma.user.findUnique({
        where: { id },
        include: {
            manager: { select: { id: true, name: true, email: true } },
            visits: {
                orderBy: { checkInTime: 'desc' },
                take: 20,
                include: {
                    doctor: true,
                    productsDiscussed: { include: { product: true } },
                },
            },
            tourPlans: {
                orderBy: { weekStart: 'desc' },
                take: 10,
            },
            expenses: {
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
        },
    });
    if (!mr || mr.role !== 'MR') {
        return res.status(404).json({ error: 'Medical Representative not found' });
    }
    // Manager check
    if (req.user.role === 'MANAGER' && mr.managerId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You can only view reps in your team' });
    }
    const sanitizedVisits = mr.visits.map((v) => ({
        ...v,
        samplesGiven: v.samplesGiven ? JSON.parse(v.samplesGiven) : [],
    }));
    const sanitizedTourPlans = mr.tourPlans.map((p) => ({
        ...p,
        planDetails: JSON.parse(p.planDetails),
    }));
    res.json({
        mr: {
            id: mr.id,
            name: mr.name,
            email: mr.email,
            phone: mr.phone,
            region: mr.region,
            manager: mr.manager,
            createdAt: mr.createdAt,
        },
        metrics: {
            totalVisitsCompleted: mr.visits.filter((v) => v.checkOutTime !== null).length,
            totalExpensesClaimed: mr.expenses.reduce((sum, e) => sum + Number(e.amount), 0),
        },
        visits: sanitizedVisits,
        tourPlans: sanitizedTourPlans,
        expenses: mr.expenses,
    });
};
exports.getMrDetail = getMrDetail;
