import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';

const createExpenseSchema = z.object({
  category: z.enum(['travel', 'food', 'lodging', 'misc']),
  amount: z.number().positive('Amount must be greater than zero'),
  receiptUrl: z.string().optional().nullable(),
  description: z.string().min(2, 'Description is required'),
});

const reviewSchema = z.object({
  reviewNote: z.string().min(2, 'Review note is required'),
});

export const createExpense = async (req: AuthenticatedRequest, res: Response) => {
  const mrId = req.user!.id;
  const { category, amount, receiptUrl, description } = createExpenseSchema.parse(req.body);

  const expense = await prisma.expense.create({
    data: {
      mrId,
      category,
      amount,
      receiptUrl: receiptUrl || null,
      description,
      status: 'PENDING',
    },
    include: {
      mr: {
        select: { id: true, name: true, email: true, region: true },
      },
    },
  });

  res.status(201).json({
    message: 'Expense claim submitted successfully',
    expense,
  });
};

export const getMyExpenses = async (req: AuthenticatedRequest, res: Response) => {
  const mrId = req.user!.id;

  const expenses = await prisma.expense.findMany({
    where: { mrId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: expenses });
};

export const getAllExpenses = async (req: AuthenticatedRequest, res: Response) => {
  const { status, mrId, category, page = '1', limit = '20' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const whereClause: any = {};
  if (status) whereClause.status = status as string;
  if (category) whereClause.category = category as string;
  if (mrId) whereClause.mrId = mrId as string;

  if (req.user!.role === 'MANAGER') {
    const team = await prisma.user.findMany({
      where: { managerId: req.user!.id },
      select: { id: true },
    });
    const teamIds = team.map((m) => m.id);
    whereClause.mrId = mrId ? (teamIds.includes(mrId as string) ? mrId : '__NONE__') : { in: teamIds };
  }

  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where: whereClause }),
    prisma.expense.findMany({
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

  res.json({
    data: expenses,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const approveExpense = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reviewNote } = reviewSchema.parse(req.body);

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) {
    return res.status(404).json({ error: 'Expense claim not found' });
  }

  const updated = await prisma.expense.update({
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
    message: 'Expense claim approved successfully',
    expense: updated,
  });
};

export const rejectExpense = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reviewNote } = reviewSchema.parse(req.body);

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) {
    return res.status(404).json({ error: 'Expense claim not found' });
  }

  const updated = await prisma.expense.update({
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
    message: 'Expense claim rejected with feedback',
    expense: updated,
  });
};
