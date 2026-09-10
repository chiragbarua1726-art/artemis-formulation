"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.getUsers = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProducts = exports.deleteDoctor = exports.updateDoctor = exports.createDoctor = exports.getDoctors = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const doctorSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Doctor name is required'),
    specialty: zod_1.z.string().min(2, 'Specialty is required'),
    hospitalName: zod_1.z.string().min(2, 'Hospital name is required'),
    headquarters: zod_1.z.string().min(2, 'Headquarters is required'),
    address: zod_1.z.string().min(5, 'Address is required'),
    latitude: zod_1.z.number().optional().nullable(),
    longitude: zod_1.z.number().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    category: zod_1.z.enum(['Tier A', 'Tier B', 'Tier C']).optional().default('Tier B'),
});
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Product name is required'),
    sku: zod_1.z.string().min(2, 'SKU is required'),
    description: zod_1.z.string().optional().nullable(),
    category: zod_1.z.string().optional().nullable(),
    unitPrice: zod_1.z.number().min(0).optional().default(0),
});
// DOCTOR CONTROLLERS
const getDoctors = async (req, res) => {
    const { search, specialty, category, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;
    const whereClause = { active: true };
    if (search) {
        whereClause.OR = [
            { name: { contains: search } },
            { hospitalName: { contains: search } },
            { address: { contains: search } },
            { specialty: { contains: search } },
        ];
    }
    if (specialty)
        whereClause.specialty = specialty;
    if (category)
        whereClause.category = category;
    const [total, doctors] = await Promise.all([
        prisma_1.prisma.doctor.count({ where: whereClause }),
        prisma_1.prisma.doctor.findMany({
            where: whereClause,
            skip,
            take: limitNum,
            orderBy: { name: 'asc' },
        }),
    ]);
    res.json({
        data: doctors,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
};
exports.getDoctors = getDoctors;
const createDoctor = async (req, res) => {
    const data = doctorSchema.parse(req.body);
    const doctor = await prisma_1.prisma.doctor.create({
        data: {
            name: data.name,
            specialty: data.specialty,
            hospitalName: data.hospitalName,
            headquarters: data.headquarters,
            address: data.address,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            phone: data.phone || null,
            category: data.category || 'Tier B',
            active: true,
        },
    });
    res.status(201).json({ message: 'Doctor created successfully', doctor });
};
exports.createDoctor = createDoctor;
const updateDoctor = async (req, res) => {
    const { id } = req.params;
    const data = doctorSchema.partial().parse(req.body);
    const doctor = await prisma_1.prisma.doctor.update({
        where: { id },
        data,
    });
    res.json({ message: 'Doctor updated successfully', doctor });
};
exports.updateDoctor = updateDoctor;
const deleteDoctor = async (req, res) => {
    const { id } = req.params;
    // Soft delete
    await prisma_1.prisma.doctor.update({
        where: { id },
        data: { active: false },
    });
    res.json({ message: 'Doctor deactivated successfully' });
};
exports.deleteDoctor = deleteDoctor;
// PRODUCT CONTROLLERS
const getProducts = async (req, res) => {
    const { search, category, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;
    const whereClause = { active: true };
    if (search) {
        whereClause.OR = [
            { name: { contains: search } },
            { sku: { contains: search } },
            { description: { contains: search } },
        ];
    }
    if (category)
        whereClause.category = category;
    const [total, products] = await Promise.all([
        prisma_1.prisma.product.count({ where: whereClause }),
        prisma_1.prisma.product.findMany({
            where: whereClause,
            skip,
            take: limitNum,
            orderBy: { name: 'asc' },
        }),
    ]);
    res.json({
        data: products,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
};
exports.getProducts = getProducts;
const createProduct = async (req, res) => {
    const data = productSchema.parse(req.body);
    const existing = await prisma_1.prisma.product.findUnique({ where: { sku: data.sku } });
    if (existing) {
        return res.status(409).json({ error: 'Product with this SKU already exists' });
    }
    const product = await prisma_1.prisma.product.create({
        data: {
            name: data.name,
            sku: data.sku,
            description: data.description || null,
            category: data.category || null,
            unitPrice: data.unitPrice || 0,
            active: true,
        },
    });
    res.status(201).json({ message: 'Product created successfully', product });
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const data = productSchema.partial().parse(req.body);
    const product = await prisma_1.prisma.product.update({
        where: { id },
        data,
    });
    res.json({ message: 'Product updated successfully', product });
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.product.update({
        where: { id },
        data: { active: false },
    });
    res.json({ message: 'Product deactivated successfully' });
};
exports.deleteProduct = deleteProduct;
// USER MANAGEMENT (ADMIN ONLY)
const getUsers = async (req, res) => {
    const { role } = req.query;
    const whereClause = { active: true };
    if (role)
        whereClause.role = role;
    const users = await prisma_1.prisma.user.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            region: true,
            managerId: true,
            manager: {
                select: { id: true, name: true },
            },
            createdAt: true,
        },
        orderBy: { name: 'asc' },
    });
    res.json({ data: users });
};
exports.getUsers = getUsers;
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, phone, region, role, managerId, active } = req.body;
    const updated = await prisma_1.prisma.user.update({
        where: { id },
        data: {
            ...(name ? { name } : {}),
            ...(phone !== undefined ? { phone } : {}),
            ...(region !== undefined ? { region } : {}),
            ...(role ? { role } : {}),
            ...(managerId !== undefined ? { managerId } : {}),
            ...(active !== undefined ? { active } : {}),
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            region: true,
            managerId: true,
        },
    });
    res.json({ message: 'User updated successfully', user: updated });
};
exports.updateUser = updateUser;
