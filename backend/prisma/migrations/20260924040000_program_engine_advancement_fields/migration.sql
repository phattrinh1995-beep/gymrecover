-- Applied via `prisma db push` against the local dev sandbox (see PROGRESS.md re: shadow DB
-- instability in this environment). Recorded here for migration history / `prisma migrate deploy`
-- against a real Postgres instance.

-- AlterTable
ALTER TABLE "program_instances"
  ADD COLUMN "pendingPhaseId" TEXT,
  ADD COLUMN "eligibleSince" TIMESTAMP(3),
  ADD COLUMN "userAcknowledgedAt" TIMESTAMP(3),
  ADD COLUMN "providerAcknowledgedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "program_instances"
  ADD CONSTRAINT "program_instances_pendingPhaseId_fkey"
  FOREIGN KEY ("pendingPhaseId") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
