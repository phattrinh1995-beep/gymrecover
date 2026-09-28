import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { countCompletedSessionsSince, recentPainTrend } from './patient-summary.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class ProviderPortalService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAssigned(providerId: string, patientId: string) {
    const assignment = await this.prisma.providerAssignment.findFirst({
      where: { providerId, patientId, active: true },
    });
    if (!assignment) {
      throw new ForbiddenException('You are not an assigned provider for this patient');
    }
  }

  async listMyPatients(providerId: string) {
    const assignments = await this.prisma.providerAssignment.findMany({
      where: { providerId, active: true },
      include: {
        patient: {
          include: {
            profile: true,
            injuryProfiles: true,
            programInstances: {
              where: { track: 'RECOVERY', status: 'ACTIVE' },
              include: { currentPhase: true, sessionLogs: true },
            },
          },
        },
      },
    });

    const since = new Date(Date.now() - SEVEN_DAYS_MS);
    const patientIds = assignments.map((a) => a.patient.id);

    // One query for the latest OutcomeAssessment per patient, instead of one query per patient
    // (Prisma's `distinct` + `orderBy` compiles to Postgres `DISTINCT ON`, which is exactly
    // "first row per userId" in a single round trip). Queried by patient rather than nested under
    // ProgramInstance for the same reason noted in getPatientDetail below: an OutcomeAssessment
    // isn't required to be linked to a specific instance.
    const latestAssessments = patientIds.length
      ? await this.prisma.outcomeAssessment.findMany({
          where: { userId: { in: patientIds } },
          orderBy: { assessedAt: 'desc' },
          distinct: ['userId'],
          select: { userId: true, score: true },
        })
      : [];
    const latestScoreByPatientId = new Map(latestAssessments.map((a) => [a.userId, a.score]));

    return assignments.map(({ patient }) => {
      const instance = patient.programInstances[0];
      const painTrend = instance ? recentPainTrend(instance.sessionLogs, 1) : [];
      return {
        patientId: patient.id,
        name: patient.profile ? `${patient.profile.firstName} ${patient.profile.lastName}` : patient.email,
        region: patient.injuryProfiles[0]?.region ?? null,
        currentPhaseName: instance?.currentPhase?.name ?? null,
        manualHold: instance?.manualHold ?? false,
        pendingPhaseId: instance?.pendingPhaseId ?? null,
        sessionsThisWeek: instance ? countCompletedSessionsSince(instance.sessionLogs, since) : 0,
        latestPainScore: painTrend[0] ?? null,
        latestPromScore: latestScoreByPatientId.get(patient.id) ?? null,
      };
    });
  }

  async getPatientDetail(providerId: string, patientId: string) {
    await this.assertAssigned(providerId, patientId);

    // Non-functional requirement: audit log every provider read of patient data.
    await this.prisma.auditLog.create({
      data: { actorUserId: providerId, targetUserId: patientId, action: 'VIEW_PATIENT_DATA' },
    });

    const patient = await this.prisma.user.findUnique({
      where: { id: patientId },
      include: {
        profile: true,
        injuryProfiles: true,
        programInstances: {
          include: {
            currentPhase: {
              include: { protocolTemplate: { include: { phases: { orderBy: { order: 'asc' } } } } },
            },
            pendingPhase: true,
            sessionLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
          },
        },
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    // Queried by patient rather than nested under each ProgramInstance — see the comment in
    // listMyPatients for why (assessments aren't always linked to a specific instance).
    const outcomeAssessments = await this.prisma.outcomeAssessment.findMany({
      where: { userId: patientId },
      orderBy: { assessedAt: 'asc' },
      select: { id: true, type: true, score: true, assessedAt: true },
    });

    return {
      ...patient,
      programInstances: patient.programInstances.map((instance) => ({ ...instance, outcomeAssessments })),
    };
  }

  async getRedFlagAlerts(providerId: string, patientId: string) {
    await this.assertAssigned(providerId, patientId);
    return this.prisma.sessionLog.findMany({
      where: { userId: patientId, redFlagTriggered: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getInstanceForPatient(providerId: string, patientId: string, programInstanceId: string) {
    await this.assertAssigned(providerId, patientId);
    const instance = await this.prisma.programInstance.findUnique({ where: { id: programInstanceId } });
    if (!instance || instance.userId !== patientId) {
      throw new NotFoundException('Program instance not found for this patient');
    }
    return instance;
  }

  async placeHold(providerId: string, patientId: string, programInstanceId: string, reason: string) {
    await this.getInstanceForPatient(providerId, patientId, programInstanceId);
    const updated = await this.prisma.programInstance.update({
      where: { id: programInstanceId },
      data: { manualHold: true, manualHoldReason: reason },
    });
    await this.prisma.auditLog.create({
      data: {
        actorUserId: providerId,
        targetUserId: patientId,
        action: 'PLACE_MANUAL_HOLD',
        metadata: { programInstanceId, reason },
      },
    });
    return updated;
  }

  async releaseHold(providerId: string, patientId: string, programInstanceId: string) {
    await this.getInstanceForPatient(providerId, patientId, programInstanceId);
    const updated = await this.prisma.programInstance.update({
      where: { id: programInstanceId },
      data: { manualHold: false, manualHoldReason: null },
    });
    await this.prisma.auditLog.create({
      data: { actorUserId: providerId, targetUserId: patientId, action: 'RELEASE_MANUAL_HOLD', metadata: { programInstanceId } },
    });
    return updated;
  }

  /** Manual override of the current phase, bypassing the Adaptive Program Engine's criteria
   * evaluation entirely — this is a deliberate clinician judgment call, not a criteria-based
   * advancement, so it's audited distinctly from a routine data view. */
  async manuallySetPhase(providerId: string, patientId: string, programInstanceId: string, targetPhaseId: string, reason: string) {
    const instance = await this.getInstanceForPatient(providerId, patientId, programInstanceId);
    const targetPhase = await this.prisma.phase.findUnique({ where: { id: targetPhaseId } });
    if (!targetPhase || targetPhase.protocolTemplateId !== instance.protocolTemplateId) {
      throw new NotFoundException('Target phase not found in this program\'s protocol');
    }

    const updated = await this.prisma.programInstance.update({
      where: { id: programInstanceId },
      data: {
        currentPhaseId: targetPhaseId,
        pendingPhaseId: null,
        eligibleSince: null,
        userAcknowledgedAt: null,
        providerAcknowledgedAt: null,
      },
    });
    if (instance.injuryProfileId) {
      await this.prisma.injuryProfile.update({
        where: { id: instance.injuryProfileId },
        data: { currentPhaseId: targetPhaseId },
      });
    }
    await this.prisma.auditLog.create({
      data: {
        actorUserId: providerId,
        targetUserId: patientId,
        action: 'MANUAL_PHASE_OVERRIDE',
        metadata: { programInstanceId, fromPhaseId: instance.currentPhaseId, toPhaseId: targetPhaseId, reason },
      },
    });
    return updated;
  }
}
