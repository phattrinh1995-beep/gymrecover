-- Applied via `prisma db push` against the local dev sandbox (see PROGRESS.md re: shadow DB
-- instability in this environment). Recorded here for migration history / `prisma migrate deploy`
-- against a real Postgres instance.

-- CreateTable
CREATE TABLE "performance_program_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" "PerformanceGoal" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_program_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_program_exercises" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,
    "holdTimeSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_program_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "performance_program_templates_name_key" ON "performance_program_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "performance_program_exercises_templateId_exerciseId_key" ON "performance_program_exercises"("templateId", "exerciseId");

-- AlterTable
ALTER TABLE "program_instances" ADD COLUMN "performanceProgramTemplateId" TEXT;

-- AddForeignKey
ALTER TABLE "performance_program_exercises" ADD CONSTRAINT "performance_program_exercises_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "performance_program_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_program_exercises" ADD CONSTRAINT "performance_program_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_instances" ADD CONSTRAINT "program_instances_performanceProgramTemplateId_fkey" FOREIGN KEY ("performanceProgramTemplateId") REFERENCES "performance_program_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
