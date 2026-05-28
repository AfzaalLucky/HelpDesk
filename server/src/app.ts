import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import usersRouter from './routes/users';
import ticketsRouter from './routes/tickets';
import webhooksRouter from './routes/webhooks';

const app = express();

const isProd = process.env.NODE_ENV === 'production';

app.use(
  cors({
    origin: (origin, callback) => {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      if (!origin || origin === clientUrl || (!isProd && /^http:\/\/localhost:\d+$/.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

app.use('/api/auth/sign-in', authLimiter);
app.use('/api/auth/sign-up', authLimiter);

// Better Auth handler must come before express.json()
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/webhooks', webhooksRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
