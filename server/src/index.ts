import 'dotenv/config';
import app from './app';

const REQUIRED_ENV = [
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'DATABASE_URL',
  'DIRECT_URL',
  'CLIENT_URL',
] as const;

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const PORT = process.env.PORT ?? 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
