"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectExpense = exports.approveExpense = exports.getAllExpenses = exports.getMyExpenses = exports.createExpense = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const createExpenseSchema = zod_1.z.object({
    category: zod_1.z.enum(['travel', 'food', 'lodging', 'misc']),
    amount: zod_1.z.number().positive('Amount must be greater than zero'),
    receiptUrl: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().min(2, 'Description is required'),
});
const reviewSchema = zod_1.z.object({
    reviewNote: zod_1.z.string().min(2, 'Review note is required'),
});
const createExpense = async (req, res) => {
    const mrId = req.user.id;
    const { category, amount, receiptUrl, description } = createExpenseSchema.parse(req.body);
    const expense = await prisma_1.prisma.expense.create({
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
exports.createExpense = createExpense;
const getMyExpenses = async (req, res) => {
    const mrId = req.user.id;
    const expenses = await prisma_1.prisma.expense.findMany({
        where: { mrId },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ data: expenses });
};
exports.getMyExpenses = getMyExpenses;
const getAllExpenses = async (req, res) => {
    const { status, mrId, category, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const whereClause = {};
    if (status)
        whereClause.status = status;
    if (category)
        whereClause.category = category;
    if (mrId)
        whereClause.mrId = mrId;
    if (req.user.role === 'MANAGER') {
        const team = await prisma_1.prisma.user.findMany({
            where: { managerId: req.user.id },
            select: { id: true },
        });
        const teamIds = team.map((m) => m.id);
        whereClause.mrId = mrId ? (teamIds.includes(mrId) ? mrId : '__NONE__') : { in: teamIds };
    }
    const [total, expenses] = await Promise.all([
        prisma_1.prisma.expense.count({ where: whereClause }),
        prisma_1.prisma.expense.findMany({
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
exports.getAllExpenses = getAllExpenses;
const approveExpense = async (req, res) => {
    const { id } = req.params;
    const { reviewNote } = reviewSchema.parse(req.body);
    const expense = await prisma_1.prisma.expense.findUnique({ where: { id } });
    if (!expense) {
        return res.status(404).json({ error: 'Expense claim not found' });
    }
    const updated = await prisma_1.prisma.expense.update({
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
        message: 'Expense claim approved successfully',
        expense: updated,
    });
};
exports.approveExpense = approveExpense;
const rejectExpense = async (req, res) => {
    const { id } = req.params;
    const { reviewNote } = reviewSchema.parse(req.body);
    const expense = await prisma_1.prisma.expense.findUnique({ where: { id } });
    if (!expense) {
        return res.status(404).json({ error: 'Expense claim not found' });
    }
    const updated = await prisma_1.prisma.expense.update({
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
        message: 'Expense claim rejected with feedback',
        expense: updated,
    });
};
exports.rejectExpense = rejectExpense;
