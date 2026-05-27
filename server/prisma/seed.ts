import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { auth } from '../src/lib/auth';

const users = [
  { name: 'Admin User', email: 'admin@helpdesk.dev', password: 'Admin@123!!', role: 'admin' },
  { name: 'Agent User', email: 'agent@helpdesk.dev', password: 'Agent@123!!', role: 'agent' },
];

async function main() {
  for (const { name, email, password, role } of users) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({ where: { email }, data: { role } });
      console.log(`updated  ${role}: ${email}`);
      continue;
    }

    await auth.api.signUpEmail({ body: { name, email, password } });
    await prisma.user.update({ where: { email }, data: { role } });
    console.log(`created  ${role}: ${email}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
