import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:5000',
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: async (request) => {
    const clientUrl = process.env.CLIENT_URL!;
    if (process.env.NODE_ENV === 'production') return [clientUrl];
    const origin = request?.headers.get('origin') ?? '';
    const extra = /^http:\/\/localhost:\d+$/.test(origin) ? [origin] : [];
    return [clientUrl, ...extra];
  },
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'agent',
        input: false,
      },
    },
  },
});
