import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { status, priority, assignedToId, search, page, pageSize } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const pageSizeNum = Math.max(1, Math.min(100, parseInt(pageSize) || 10));

  const where = {
    ...(status && { status }),
    ...(priority && { priority }),
    ...(assignedToId === 'me'
      ? { assignedToId: (req.user as { id: string }).id }
      : assignedToId
        ? { assignedToId }
        : {}),
    ...(search && {
      OR: [
        { subject: { contains: search, mode: 'insensitive' as const } },
        { fromEmail: { contains: search, mode: 'insensitive' as const } },
        { fromName: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ tickets, total, page: pageNum, pageSize: pageSizeNum });
});

router.get('/:id', requireAuth, async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: String(req.params.id) },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  res.json({ ticket });
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedToId: z.string().nullable().optional(),
});

router.patch('/:id', requireAuth, async (req, res) => {
  const result = updateTicketSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const ticket = await prisma.ticket.update({
    where: { id: String(req.params.id) },
    data: result.data,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  res.json({ ticket });
});

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  fromEmail: z.string().email('Invalid email'),
  fromName: z.string().min(1, 'Name is required'),
  body: z.string().min(1, 'Message body is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

router.post('/', ...requireRole('admin'), async (req, res) => {
  const result = createTicketSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { subject, fromEmail, fromName, body, priority } = result.data;

  const ticket = await prisma.ticket.create({
    data: {
      subject,
      fromEmail,
      fromName,
      priority: priority ?? 'medium',
      messages: {
        create: { body, direction: 'inbound', fromEmail, fromName },
      },
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      _count: { select: { messages: true } },
    },
  });

  res.status(201).json({ ticket });
});

export default router;
