import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';

const doctorSchema = z.object({
  name: z.string().min(2, 'Doctor name is required'),
  specialty: z.string().min(2, 'Specialty is required'),
  hospitalName: z.string().min(2, 'Hospital name is required'),
  address: z.string().min(5, 'Address is required'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  phone: z.string().optional().nullable(),
  category: z.enum(['Tier A', 'Tier B', 'Tier C']).optional().default('Tier B'),
});

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unitPrice: z.number().min(0).optional().default(0),
});

// DOCTOR CONTROLLERS
export const getDoctors = async (req: AuthenticatedRequest, res: Response) => {
  const { search, specialty, category, page = '1', limit = '50' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const whereClause: any = { active: true };

  if (search) {
    whereClause.OR = [
      { name: { contains: search as string } },
      { hospitalName: { contains: search as string } },
      { address: { contains: search as string } },
      { specialty: { contains: search as string } },
    ];
  }

  if (specialty) whereClause.specialty = specialty as string;
  if (category) whereClause.category = category as string;

  const [total, doctors] = await Promise.all([
    prisma.doctor.count({ where: whereClause }),
    prisma.doctor.findMany({
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

export const createDoctor = async (req: AuthenticatedRequest, res: Response) => {
  const data = doctorSchema.parse(req.body);

  const doctor = await prisma.doctor.create({
    data: {
      name: data.name,
      specialty: data.specialty,
      hospitalName: data.hospitalName,
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

export const updateDoctor = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = doctorSchema.partial().parse(req.body);

  const doctor = await prisma.doctor.update({
    where: { id },
    data,
  });

  res.json({ message: 'Doctor updated successfully', doctor });
};

export const deleteDoctor = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Soft delete
  await prisma.doctor.update({
    where: { id },
    data: { active: false },
  });

  res.json({ message: 'Doctor deactivated successfully' });
};

// PRODUCT CONTROLLERS
export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  const { search, category, page = '1', limit = '50' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const whereClause: any = { active: true };

  if (search) {
    whereClause.OR = [
      { name: { contains: search as string } },
      { sku: { contains: search as string } },
      { description: { contains: search as string } },
    ];
  }

  if (category) whereClause.category = category as string;

  const [total, products] = await Promise.all([
    prisma.product.count({ where: whereClause }),
    prisma.product.findMany({
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

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  const data = productSchema.parse(req.body);

  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) {
    return res.status(409).json({ error: 'Product with this SKU already exists' });
  }

  const product = await prisma.product.create({
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

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = productSchema.partial().parse(req.body);

  const product = await prisma.product.update({
    where: { id },
    data,
  });

  res.json({ message: 'Product updated successfully', product });
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  await prisma.product.update({
    where: { id },
    data: { active: false },
  });

  res.json({ message: 'Product deactivated successfully' });
};

// USER MANAGEMENT (ADMIN ONLY)
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.query;

  const whereClause: any = { active: true };
  if (role) whereClause.role = role as string;

  const users = await prisma.user.findMany({
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

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, phone, region, role, managerId, active } = req.body;

  const updated = await prisma.user.update({
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
