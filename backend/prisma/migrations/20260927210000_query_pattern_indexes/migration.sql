-- Applied via `prisma db push` against the local dev sandbox (see PROGRESS.md re: shadow DB
-- instability in this environment). Recorded here for migration history / `prisma migrate deploy`
-- against a real Postgres instance.
--
-- Added during a full audit pass: composite indexes matching real query patterns that were
-- previously only covered by single-column indexes.

-- CreateIndex
CREATE INDEX "session_logs_userId_createdAt_idx" ON "session_logs"("userId", "createdAt");

-- DropIndex
-- The OutcomeAssessment schema's single-column @@index([userId]) was replaced with a composite
-- index (see below) rather than kept alongside it, since the composite already serves every
-- query the single-column index served.
DROP INDEX "outcome_assessments_userId_idx";

-- CreateIndex
CREATE INDEX "outcome_assessments_userId_assessedAt_idx" ON "outcome_assessments"("userId", "assessedAt");
