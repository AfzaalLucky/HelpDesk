import { Router } from 'express';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'agent']).default('agent'),
});

router.get('/', ...requireRole('admin'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ users });
});

router.post('/', ...requireRole('admin'), async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { name, email, password, role } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'A user with this email already exists' });
    return;
  }

  const userId = randomUUID();
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        emailVerified: false,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: userId,
        providerId: 'credential',
        userId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  res.status(201).json({ user });
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['admin', 'agent']).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

router.patch('/:id', ...requireRole('admin'), async (req, res) => {
  const id = String(req.params.id);
  const result = updateUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { name, email, role, password } = result.data;

  if (email) {
    const existing = await prisma.user.findFirst({ where: { email, NOT: { id } } });
    if (existing) {
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }
  }

  const userUpdateData: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) userUpdateData.name = name;
  if (email !== undefined) userUpdateData.email = email;
  if (role !== undefined) userUpdateData.role = role;

  const user = await prisma.user.update({
    where: { id },
    data: userUpdateData,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.account.updateMany({
      where: { userId: id, providerId: 'credential' },
      data: { password: hashedPassword, updatedAt: new Date() },
    });
  }

  res.json({ user });
});

router.delete('/:id', ...requireRole('admin'), async (req, res) => {
  const id = String(req.params.id);

  if (id === (req.user as { id: string }).id) {
    res.status(400).json({ error: 'You cannot delete your own account' });
    return;
  }

  await prisma.user.delete({ where: { id } });
  res.status(204).end();
});

export default router;
