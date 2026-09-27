/**
 * DEV HELPER — not a real admin-provisioning flow. There's no UI for granting SUPER_ADMIN (the
 * CMS role) since that's a rare, sensitive operation; a real deployment would grant it via direct
 * database access or a proper internal tool, not a self-service invite. This script bootstraps
 * the first CMS admin for local development/demo.
 *
 * Usage: npx tsx prisma/dev-grant-super-admin.ts <email>
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const [email] = process.argv.slice(2);
  if (!email) {
    console.error('Usage: npx tsx prisma/dev-grant-super-admin.ts <email>');
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { authSubjectId: `dev|${email}` },
    create: { authSubjectId: `dev|${email}`, email, role: 'SUPER_ADMIN' },
    update: { role: 'SUPER_ADMIN' },
  });
  console.log(JSON.stringify({ email: user.email, role: user.role }));
}
main().finally(() => prisma.$disconnect());
