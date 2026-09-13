import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';

const createAttendanceSchema = z.object({
  attendanceDate: z.coerce.date().optional(),
  checkInTime: z.coerce.date().optional(),
  checkInLat: z.number().min(-90).max(90).optional().nullable(),
  checkInLng: z.number().min(-180).max(180).optional().nullable(),
  notes: z.string().max(2_000).optional().nullable(),
});

const checkoutSchema = z.object({
  checkOutTime: z.coerce.date().optional(),
  checkOutLat: z.number().min(-90).max(90).optional().nullable(),
  checkOutLng: z.number().min(-180).max(180).optional().nullable(),
  notes: z.string().max(2_000).optional().nullable(),
});

const reviewSchema = z.object({ reviewNote: z.string().trim().min(2).optional() });

function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { gte: start, lt: end };
}

async function teamFilter(req: AuthenticatedRequest) {
  if (req.user!.role !== 'MANAGER') return undefined;
  const reports = await prisma.user.findMany({
    where: { managerId: req.user!.id, active: true },
    select: { id: true },
  });
  return reports.map((report) => report.id);
}

export const createAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const data = createAttendanceSchema.parse(req.body);
  const attendanceDate = data.attendanceDate || new Date();
  const existing = await prisma.attendance.findFirst({
    where: { mrId: req.user!.id, attendanceDate: dayRange(attendanceDate) },
  });
  if (existing) return res.status(409).json({ error: 'Attendance has already been recorded for this day', attendance: existing });

  const attendance = await prisma.attendance.create({
    data: {
      mrId: req.user!.id,
      attendanceDate,
      checkInTime: data.checkInTime || new Date(),
      checkInLat: data.checkInLat ?? null,
      checkInLng: data.checkInLng ?? null,
      notes: data.notes || null,
      status: req.user!.role === 'MR' ? 'PENDING' : 'APPROVED',
    },
  });
  return res.status(201).json({ message: 'Daily attendance submitted successfully', attendance });
};

export const checkOutAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const data = checkoutSchema.parse(req.body);
  const attendance = await prisma.attendance.findUnique({ where: { id: req.params.id } });
  if (!attendance) return res.status(404).json({ error: 'Attendance record not found' });
  if (attendance.mrId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: You can only check out your own attendance' });
  }
  if (attendance.checkOutTime) return res.status(400).json({ error: 'Attendance has already been checked out' });
  const updated = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOutTime: data.checkOutTime || new Date(),
      checkOutLat: data.checkOutLat ?? null,
      checkOutLng: data.checkOutLng ?? null,
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
    },
  });
  return res.json({ message: 'Daily attendance checked out successfully', attendance: updated });
};

export const getMyAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const { from, to, limit = '100' } = req.query;
  const where: any = { mrId: req.user!.id };
  if (from || to) {
    where.attendanceDate = {};
    if (from) where.attendanceDate.gte = new Date(from as string);
    if (to) where.attendanceDate.lte = new Date(to as string);
  }
  const data = await prisma.attendance.findMany({
    where,
    take: Math.min(365, Math.max(1, Number(limit) || 100)),
    orderBy: { attendanceDate: 'desc' },
  });
  return res.json({ data });
};

export const getTeamAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const ids = await teamFilter(req);
  const where: any = ids ? { mrId: { in: ids } } : {};
  if (req.query.status) where.status = req.query.status as string;
  const data = await prisma.attendance.findMany({
    where,
    orderBy: { attendanceDate: 'desc' },
    include: { mr: { select: { id: true, name: true, email: true, region: true } } },
  });
  return res.json({ data });
};

async function reviewAttendance(req: AuthenticatedRequest, res: Response, status: 'APPROVED' | 'REJECTED') {
  const attendance = await prisma.attendance.findUnique({ where: { id: req.params.id } });
  if (!attendance) return res.status(404).json({ error: 'Attendance record not found' });
  if (req.user!.role === 'MANAGER') {
    const mr = await prisma.user.findUnique({ where: { id: attendance.mrId }, select: { managerId: true } });
    if (mr?.managerId !== req.user!.id) return res.status(403).json({ error: 'Forbidden: Attendance is outside your team' });
  }
  const { reviewNote } = reviewSchema.parse(req.body);
  const updated = await prisma.attendance.update({
    where: { id: attendance.id },
    data: { status, reviewedBy: req.user!.name, reviewNote: reviewNote || null, reviewedAt: new Date() },
  });
  return res.json({ message: `Attendance ${status.toLowerCase()} successfully`, attendance: updated });
}

export const approveAttendance = (req: AuthenticatedRequest, res: Response) => reviewAttendance(req, res, 'APPROVED');
export const rejectAttendance = (req: AuthenticatedRequest, res: Response) => reviewAttendance(req, res, 'REJECTED');
