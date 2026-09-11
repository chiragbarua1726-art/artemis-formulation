import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';
import { validateImportRows } from '../../lib/bulkImport';

const chemistSchema = z.object({
  name: z.string().trim().min(2, 'Chemist name is required'),
  address: z.string().trim().min(3, 'Address is required'),
  phone: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const orderSchema = z.object({
  customerName: z.string().trim().min(2, 'Customer name is required'),
  productName: z.string().trim().min(2, 'Product name is required'),
  productSku: z.string().trim().optional().nullable(),
  quantity: z.coerce.number().int().positive('Quantity must be greater than zero'),
  notes: z.string().trim().optional().nullable(),
});

const reviewSchema = z.object({ reviewNote: z.string().trim().min(2).optional() });

const importChemistSchema = chemistSchema;
const importOrderSchema = orderSchema;

function importResponse(input: unknown, schema: z.ZodTypeAny) {
  const result = validateImportRows(input, schema);
  return {
    totalRows: result.totalRows,
    validCount: result.valid.length,
    invalidCount: result.errors.length,
    rows: result.valid,
    errors: result.errors,
  };
}

export const previewChemistImport = async (req: AuthenticatedRequest, res: Response) => {
  return res.json(importResponse(req.body, importChemistSchema));
};

export const previewOrderImport = async (req: AuthenticatedRequest, res: Response) => {
  return res.json(importResponse(req.body, importOrderSchema));
};

export const confirmChemistImport = async (req: AuthenticatedRequest, res: Response) => {
  if (req.body.confirm !== true) return res.status(400).json({ error: 'Confirmation is required before importing rows' });
  const result = validateImportRows(req.body, importChemistSchema);
  const data = await prisma.$transaction(result.valid.map(({ data }) => prisma.chemist.create({
    data: { ...data, phone: data.phone || null, notes: data.notes || null, mrId: req.user!.id, status: req.user!.role === 'MR' ? 'PENDING' : 'APPROVED' },
  })));
  return res.status(201).json({ message: `${data.length} chemists imported successfully`, data, importedCount: data.length, errors: result.errors });
};

export const confirmOrderImport = async (req: AuthenticatedRequest, res: Response) => {
  if (req.body.confirm !== true) return res.status(400).json({ error: 'Confirmation is required before importing rows' });
  const result = validateImportRows(req.body, importOrderSchema);
  const data = await prisma.$transaction(result.valid.map(({ data }) => prisma.povOrder.create({
    data: { ...data, productSku: data.productSku || null, notes: data.notes || null, mrId: req.user!.id, status: req.user!.role === 'MR' ? 'PENDING' : 'APPROVED' },
  })));
  return res.status(201).json({ message: `${data.length} orders imported successfully`, data, importedCount: data.length, errors: result.errors });
};

async function teamIds(req: AuthenticatedRequest) {
  if (req.user!.role !== 'MANAGER') return undefined;
  const reports = await prisma.user.findMany({
    where: {
      active: true,
      OR: [{ managerId: req.user!.id }, { managerId: null }],
    },
    select: { id: true },
  });
  return reports.map((report) => report.id);
}

function reviewMessage(type: string, status: 'APPROVED' | 'REJECTED') {
  return `${type} ${status.toLowerCase()} successfully`;
}

export const getChemists = async (req: AuthenticatedRequest, res: Response) => {
  const ids = await teamIds(req);
  const where: any = req.user!.role === 'MR'
    ? { mrId: req.user!.id }
    : ids
      ? { mrId: { in: ids } }
      : {};
  if (req.query.status) where.status = req.query.status as string;
  const data = await prisma.chemist.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { mr: { select: { id: true, name: true, email: true } } },
  });
  return res.json({ data });
};

export const createChemist = async (req: AuthenticatedRequest, res: Response) => {
  const data = chemistSchema.parse(req.body);
  const chemist = await prisma.chemist.create({
    data: {
      ...data,
      phone: data.phone || null,
      notes: data.notes || null,
      mrId: req.user!.id,
      status: req.user!.role === 'MR' ? 'PENDING' : 'APPROVED',
    },
  });
  return res.status(201).json({
    message: req.user!.role === 'MR' ? 'Chemist submitted for manager approval' : 'Chemist created successfully',
    chemist,
  });
};

export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
  const ids = await teamIds(req);
  const where: any = req.user!.role === 'MR'
    ? { mrId: req.user!.id }
    : ids
      ? { mrId: { in: ids } }
      : {};
  if (req.query.status) where.status = req.query.status as string;
  const data = await prisma.povOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { mr: { select: { id: true, name: true, email: true } } },
  });
  return res.json({ data });
};

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  const data = orderSchema.parse(req.body);
  const order = await prisma.povOrder.create({
    data: {
      ...data,
      productSku: data.productSku || null,
      notes: data.notes || null,
      mrId: req.user!.id,
      status: req.user!.role === 'MR' ? 'PENDING' : 'APPROVED',
    },
  });
  return res.status(201).json({
    message: req.user!.role === 'MR' ? 'POV order submitted for manager approval' : 'POV order created successfully',
    order,
    povOrder: order,
  });
};

async function canReview(req: AuthenticatedRequest, mrId: string) {
  if (req.user!.role === 'ADMIN') return true;
  const mr = await prisma.user.findUnique({ where: { id: mrId }, select: { managerId: true } });
  return mr?.managerId === req.user!.id || mr?.managerId == null;
}

export async function reviewChemist(req: AuthenticatedRequest, res: Response, status: 'APPROVED' | 'REJECTED') {
  const chemist = await prisma.chemist.findUnique({ where: { id: req.params.id } });
  if (!chemist) return res.status(404).json({ error: 'Chemist not found' });
  if (!(await canReview(req, chemist.mrId))) return res.status(403).json({ error: 'Forbidden: Chemist is outside your team' });
  const { reviewNote } = reviewSchema.parse(req.body);
  const updated = await prisma.chemist.update({
    where: { id: chemist.id },
    data: { status, reviewedBy: req.user!.name, reviewNote: reviewNote || null, reviewedAt: new Date() },
  });
  return res.json({ message: reviewMessage('Chemist', status), chemist: updated });
}

export async function reviewOrder(req: AuthenticatedRequest, res: Response, status: 'APPROVED' | 'REJECTED') {
  const order = await prisma.povOrder.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'POV order not found' });
  if (!(await canReview(req, order.mrId))) return res.status(403).json({ error: 'Forbidden: Order is outside your team' });
  const { reviewNote } = reviewSchema.parse(req.body);
  const updated = await prisma.povOrder.update({
    where: { id: order.id },
    data: { status, reviewedBy: req.user!.name, reviewNote: reviewNote || null, reviewedAt: new Date() },
  });
  return res.json({ message: reviewMessage('POV order', status), order: updated, povOrder: updated });
}

export const approveChemist = (req: AuthenticatedRequest, res: Response) => reviewChemist(req, res, 'APPROVED');
export const rejectChemist = (req: AuthenticatedRequest, res: Response) => reviewChemist(req, res, 'REJECTED');
export const approveOrder = (req: AuthenticatedRequest, res: Response) => reviewOrder(req, res, 'APPROVED');
export const rejectOrder = (req: AuthenticatedRequest, res: Response) => reviewOrder(req, res, 'REJECTED');
