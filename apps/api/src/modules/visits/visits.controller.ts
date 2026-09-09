import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';

const checkInSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const checkoutSchema = z.object({
  productsDiscussed: z.array(
    z.object({
      productId: z.string().uuid().optional(),
      productName: z.string().min(2).optional(),
      notes: z.string().optional(),
      quantity: z.number().int().min(0).optional(),
      value: z.number().min(0).optional(),
    })
  ).optional().default([]),
  samplesGiven: z.array(
    z.object({
      productId: z.string().uuid().optional(),
      productName: z.string(),
      quantity: z.number().int().min(1),
      value: z.number().min(0).optional(),
    })
  ).optional(),
  feedback: z.string().optional(),
  photoUrl: z.string().optional().nullable(),
});

export const checkIn = async (req: AuthenticatedRequest, res: Response) => {
  const mrId = req.user!.id;
  const { doctorId, lat, lng } = checkInSchema.parse(req.body);

  // Verify doctor exists
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  // Check if there is already an active (un-checked-out) visit
  const existingActive = await prisma.visit.findFirst({
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

  const visit = await prisma.visit.create({
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

export const checkOut = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const mrId = req.user!.id;
  const { productsDiscussed, samplesGiven, feedback, photoUrl } = checkoutSchema.parse(req.body);

  const visit = await prisma.visit.findUnique({
    where: { id },
    include: { doctor: true },
  });

  if (!visit) {
    return res.status(404).json({ error: 'Visit record not found' });
  }

  // rep can only checkout their own visit, unless admin
  if (visit.mrId !== mrId && req.user!.role !== 'ADMIN') {
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
        const product = await prisma.product.create({
          data: {
            name: pd.productName,
            sku: `MR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            unitPrice: pd.value ?? 0,
            active: true,
          },
        });
        productId = product.id;
      }
      if (!productId) continue;
      await prisma.productDiscussion.create({
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

  const updatedVisit = await prisma.visit.update({
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

export const getMyVisits = async (req: AuthenticatedRequest, res: Response) => {
  const mrId = req.user!.id;
  const { from, to, page = '1', limit = '20' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const whereClause: any = { mrId };

  if (from || to) {
    whereClause.checkInTime = {};
    if (from) whereClause.checkInTime.gte = new Date(from as string);
    if (to) whereClause.checkInTime.lte = new Date(to as string);
  }

  const [total, rawVisits] = await Promise.all([
    prisma.visit.count({ where: whereClause }),
    prisma.visit.findMany({
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

export const getActiveVisit = async (req: AuthenticatedRequest, res: Response) => {
  const mrId = req.user!.id;

  const active = await prisma.visit.findFirst({
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

export const getAllVisits = async (req: AuthenticatedRequest, res: Response) => {
  const { mrId, doctorId, from, to, page = '1', limit = '20' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const whereClause: any = {};

  if (mrId) whereClause.mrId = mrId as string;
  if (doctorId) whereClause.doctorId = doctorId as string;

  // If manager, restrict to their team members
  if (req.user!.role === 'MANAGER') {
    const teamMembers = await prisma.user.findMany({
      where: { managerId: req.user!.id },
      select: { id: true },
    });
    const teamIds = teamMembers.map((m) => m.id);
    whereClause.mrId = mrId ? (teamIds.includes(mrId as string) ? mrId : '__NONE__') : { in: teamIds };
  }

  if (from || to) {
    whereClause.checkInTime = {};
    if (from) whereClause.checkInTime.gte = new Date(from as string);
    if (to) whereClause.checkInTime.lte = new Date(to as string);
  }

  const [total, rawVisits] = await Promise.all([
    prisma.visit.count({ where: whereClause }),
    prisma.visit.findMany({
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
