/**
 * DEV HELPER — not a real invite flow. Provider/patient assignment creation (invites) is build
 * order item 10, not built yet. Until then, this script wires up a demo provider account and
 * assigns them to an existing patient by email, so the provider portal has something to show.
 *
 * Usage: npx tsx prisma/dev-assign-provider.ts <providerEmail> <patientEmail>
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const [providerEmail, patientEmail] = process.argv.slice(2);
  if (!providerEmail || !patientEmail) {
    console.error('Usage: npx tsx prisma/dev-assign-provider.ts <providerEmail> <patientEmail>');
    process.exit(1);
  }

  const patient = await prisma.user.findUniqueOrThrow({ where: { email: patientEmail } });
  const provider = await prisma.user.upsert({
    where: { authSubjectId: `dev|${providerEmail}` },
    create: { authSubjectId: `dev|${providerEmail}`, email: providerEmail, role: 'PROVIDER' },
    update: { role: 'PROVIDER' },
  });
  const existing = await prisma.providerAssignment.findFirst({ where: { providerId: provider.id, patientId: patient.id } });
  if (existing) {
    await prisma.providerAssignment.update({ where: { id: existing.id }, data: { active: true } });
  } else {
    await prisma.providerAssignment.create({ data: { providerId: provider.id, patientId: patient.id, active: true } });
  }
  console.log(JSON.stringify({ providerEmail: provider.email, patientEmail: patient.email }));
}
main().finally(() => prisma.$disconnect());
