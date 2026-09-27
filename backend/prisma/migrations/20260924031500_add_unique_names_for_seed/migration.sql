-- Applied via `prisma db push` against the local dev sandbox because this environment's
-- bundled `prisma dev` Postgres does not reliably support the shadow database `migrate dev`
-- needs (see PROGRESS.md). This file records the equivalent SQL for migration history /
-- `prisma migrate deploy` against a real Postgres instance.

-- AlterTable
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_name_key" UNIQUE ("name");

-- AlterTable
ALTER TABLE "protocol_templates" ADD CONSTRAINT "protocol_templates_name_key" UNIQUE ("name");
