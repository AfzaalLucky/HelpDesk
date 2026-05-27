import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = session.user;
  req.session = session.session;
  next();
};

export const requireRole = (role: string) => [
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    if ((req.user as { role?: string })?.role !== role) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  },
];
