-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'PROVIDER', 'ORG_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "InjuryRegion" AS ENUM ('KNEE', 'SHOULDER', 'HIP', 'ANKLE_FOOT', 'SPINE', 'ELBOW_WRIST', 'GENERAL_MUSCLE');

-- CreateEnum
CREATE TYPE "Side" AS ENUM ('LEFT', 'RIGHT', 'BILATERAL', 'NA');

-- CreateEnum
CREATE TYPE "ClearanceStatus" AS ENUM ('SELF_REPORTED', 'PROVIDER_CONFIRMED', 'PENDING');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'ATHLETE');

-- CreateEnum
CREATE TYPE "ProgramTrack" AS ENUM ('RECOVERY', 'PERFORMANCE');

-- CreateEnum
CREATE TYPE "PerformanceGoal" AS ENUM ('STRENGTH', 'HYPERTROPHY', 'CONDITIONING');

-- CreateEnum
CREATE TYPE "ProgramInstanceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'GRADUATED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PromType" AS ENUM ('KOOS', 'QUICKDASH');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('GYM', 'CLINIC', 'HYBRID');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'TRIAL', 'BASIC', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL DEFAULT 'GYM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'TRIAL',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "seats" INTEGER NOT NULL DEFAULT 1,
    "stripeCustomerId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "authSubjectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "goals" TEXT,
    "activityLevel" "ActivityLevel" NOT NULL DEFAULT 'MODERATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "injury_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "region" "InjuryRegion" NOT NULL,
    "diagnosisText" TEXT,
    "diagnosisCategory" TEXT,
    "surgeryType" TEXT,
    "surgeryDate" TIMESTAMP(3),
    "side" "Side" NOT NULL DEFAULT 'NA',
    "clearanceStatus" "ClearanceStatus" NOT NULL DEFAULT 'SELF_REPORTED',
    "currentPhaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "injury_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" "InjuryRegion" NOT NULL,
    "description" TEXT,
    "reviewedBy" TEXT NOT NULL DEFAULT 'PLACEHOLDER - requires licensed clinical review',
    "sourceCitation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL,
    "protocolTemplateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entryCriteria" JSONB NOT NULL,
    "exitCriteria" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "region" "InjuryRegion",
    "equipment" TEXT,
    "videoUrl" TEXT,
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phase_exercises" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,
    "holdTimeSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phase_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_instances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "track" "ProgramTrack" NOT NULL,
    "status" "ProgramInstanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "injuryProfileId" TEXT,
    "protocolTemplateId" TEXT,
    "currentPhaseId" TEXT,
    "manualHold" BOOLEAN NOT NULL DEFAULT false,
    "manualHoldReason" TEXT,
    "performanceGoal" "PerformanceGoal",
    "graduatedFromId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_logs" (
    "id" TEXT NOT NULL,
    "programInstanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "exerciseResults" JSONB,
    "painScore" INTEGER,
    "rpe" INTEGER,
    "notes" TEXT,
    "redFlagTriggered" BOOLEAN NOT NULL DEFAULT false,
    "redFlagDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outcome_assessments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programInstanceId" TEXT,
    "type" "PromType" NOT NULL,
    "rawAnswers" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outcome_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_assignments" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "organizationId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "provider_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_organizationId_key" ON "subscriptions"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "users_authSubjectId_key" ON "users"("authSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "injury_profiles_userId_idx" ON "injury_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "phases_protocolTemplateId_order_key" ON "phases"("protocolTemplateId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "phase_exercises_phaseId_exerciseId_key" ON "phase_exercises"("phaseId", "exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "program_instances_graduatedFromId_key" ON "program_instances"("graduatedFromId");

-- CreateIndex
CREATE INDEX "program_instances_userId_idx" ON "program_instances"("userId");

-- CreateIndex
CREATE INDEX "session_logs_programInstanceId_idx" ON "session_logs"("programInstanceId");

-- CreateIndex
CREATE INDEX "session_logs_userId_idx" ON "session_logs"("userId");

-- CreateIndex
CREATE INDEX "outcome_assessments_userId_idx" ON "outcome_assessments"("userId");

-- CreateIndex
CREATE INDEX "provider_assignments_providerId_patientId_idx" ON "provider_assignments"("providerId", "patientId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_logs_targetUserId_idx" ON "audit_logs"("targetUserId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "injury_profiles" ADD CONSTRAINT "injury_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "injury_profiles" ADD CONSTRAINT "injury_profiles_currentPhaseId_fkey" FOREIGN KEY ("currentPhaseId") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phases" ADD CONSTRAINT "phases_protocolTemplateId_fkey" FOREIGN KEY ("protocolTemplateId") REFERENCES "protocol_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_exercises" ADD CONSTRAINT "phase_exercises_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_exercises" ADD CONSTRAINT "phase_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_instances" ADD CONSTRAINT "program_instances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_instances" ADD CONSTRAINT "program_instances_injuryProfileId_fkey" FOREIGN KEY ("injuryProfileId") REFERENCES "injury_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_instances" ADD CONSTRAINT "program_instances_protocolTemplateId_fkey" FOREIGN KEY ("protocolTemplateId") REFERENCES "protocol_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_instances" ADD CONSTRAINT "program_instances_currentPhaseId_fkey" FOREIGN KEY ("currentPhaseId") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_instances" ADD CONSTRAINT "program_instances_graduatedFromId_fkey" FOREIGN KEY ("graduatedFromId") REFERENCES "program_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_programInstanceId_fkey" FOREIGN KEY ("programInstanceId") REFERENCES "program_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outcome_assessments" ADD CONSTRAINT "outcome_assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outcome_assessments" ADD CONSTRAINT "outcome_assessments_programInstanceId_fkey" FOREIGN KEY ("programInstanceId") REFERENCES "program_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_assignments" ADD CONSTRAINT "provider_assignments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_assignments" ADD CONSTRAINT "provider_assignments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_assignments" ADD CONSTRAINT "provider_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
