import { Router } from 'express';
import { requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', ...requireRole('admin'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ users });
});

router.patch('/:id', ...requireRole('admin'), async (req, res) => {
  const id = String(req.params.id);
  const { role } = req.body as { role: string };

  if (!['admin', 'agent'].includes(role)) {
    res.status(400).json({ error: 'Role must be admin or agent' });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
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
