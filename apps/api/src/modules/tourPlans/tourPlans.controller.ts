import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';

const createTourPlanSchema = z.object({
  weekStart: z.string().datetime(),
  weekEnd: z.string().datetime(),
  planDetails: z.array(
    z.object({
      date: z.string(),
      area: z.string(),
      doctorIds: z.array(z.string()).default([]),
      targetCalls: z.number().optional().default(5),
      notes: z.string().optional(),
    })
  ),
});

const reviewSchema = z.object({
  reviewNote: z.string().min(2, 'Review note is required'),
});

export const createTourPlan = async (req: AuthenticatedRequest, res: Response) => {
  const mrId = req.user!.id;
  const { weekStart, weekEnd, planDetails } = createTourPlanSchema.parse(req.body);

  const plan = await prisma.tourPlan.create({
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

export const getMyTourPlans = async (req: AuthenticatedRequest, res: Response) => {
  const mrId = req.user!.id;

  const rawPlans = await prisma.tourPlan.findMany({
    where: { mrId },
    orderBy: { weekStart: 'desc' },
  });

  const plans = rawPlans.map((p) => ({
    ...p,
    planDetails: JSON.parse(p.planDetails),
  }));

  res.json({ data: plans });
};

export const getAllTourPlans = async (req: AuthenticatedRequest, res: Response) => {
  const { status, mrId, page = '1', limit = '20' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const whereClause: any = {};
  if (status) whereClause.status = status as string;
  if (mrId) whereClause.mrId = mrId as string;

  // Manager filter: only MRs reporting to this manager
  if (req.user!.role === 'MANAGER') {
    const team = await prisma.user.findMany({
      where: { managerId: req.user!.id },
      select: { id: true },
    });
    const teamIds = team.map((m) => m.id);
    whereClause.mrId = mrId ? (teamIds.includes(mrId as string) ? mrId : '__NONE__') : { in: teamIds };
  }

  const [total, rawPlans] = await Promise.all([
    prisma.tourPlan.count({ where: whereClause }),
    prisma.tourPlan.findMany({
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

export const approveTourPlan = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reviewNote } = reviewSchema.parse(req.body);

  const plan = await prisma.tourPlan.findUnique({
    where: { id },
    include: { mr: true },
  });

  if (!plan) {
    return res.status(404).json({ error: 'Tour plan not found' });
  }

  const updated = await prisma.tourPlan.update({
    where: { id },
    data: {
      status: 'APPROVED',
      reviewedBy: req.user!.name,
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

export const rejectTourPlan = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reviewNote } = reviewSchema.parse(req.body);

  const plan = await prisma.tourPlan.findUnique({ where: { id } });
  if (!plan) {
    return res.status(404).json({ error: 'Tour plan not found' });
  }

  const updated = await prisma.tourPlan.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedBy: req.user!.name,
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
