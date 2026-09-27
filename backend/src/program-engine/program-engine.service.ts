import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { evaluatePhaseExitCriteria, type CriteriaFacts } from './criteria.js';
import { shouldApplyAdvancement } from './advancement.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PAIN_SCORE_WINDOW = 3;

@Injectable()
export class ProgramEngineService {
  constructor(private readonly prisma: PrismaService) {}

  private async loadInstance(programInstanceId: string) {
    const instance = await this.prisma.programInstance.findUnique({
      where: { id: programInstanceId },
      include: { currentPhase: true, injuryProfile: true },
    });
    if (!instance) throw new NotFoundException('Program instance not found');
    return instance;
  }

  private async computeFacts(instance: NonNullable<Awaited<ReturnType<typeof this.loadInstance>>>): Promise<CriteriaFacts> {
    const now = new Date();

    const daysSinceSurgery = instance.injuryProfile?.surgeryDate
      ? Math.floor((now.getTime() - instance.injuryProfile.surgeryDate.getTime()) / MS_PER_DAY)
      : null;

    const recentPainLogs = await this.prisma.sessionLog.findMany({
      where: { programInstanceId: instance.id, painScore: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: PAIN_SCORE_WINDOW,
      select: { painScore: true },
    });

    const since24h = new Date(now.getTime() - MS_PER_DAY);
    const recentLogsForSwelling = await this.prisma.sessionLog.findMany({
      where: { userId: instance.userId, createdAt: { gte: since24h } },
      select: { redFlagDetails: true },
    });
    const swellingReportedInLast24h = recentLogsForSwelling.some((log) => {
      const details = log.redFlagDetails as { newOrIncreasingSwelling?: boolean } | null;
      return details?.newOrIncreasingSwelling === true;
    });

    return {
      daysSinceSurgery,
      recentPainScores: recentPainLogs.map((l) => l.painScore as number),
      swellingReportedInLast24h,
    };
  }

  /**
   * Runs the engine for a program instance's current phase and, if newly eligible, records a
   * pending advancement prompt. Never changes currentPhaseId itself — see acknowledge().
   */
  async checkEligibility(userId: string, programInstanceId: string) {
    const instance = await this.loadInstance(programInstanceId);
    if (instance.userId !== userId) {
      throw new ForbiddenException('Not your program instance');
    }

    if (!instance.currentPhase) {
      return { eligible: false, reason: 'No active phase on this program instance.', results: [], nextPhase: null };
    }

    if (instance.manualHold) {
      return {
        eligible: false,
        reason: instance.manualHoldReason ?? 'A provider has placed a hold on this program.',
        results: [],
        nextPhase: null,
      };
    }

    const facts = await this.computeFacts(instance);
    const exitCriteria = instance.currentPhase.exitCriteria as Record<string, unknown>;
    const evaluation = evaluatePhaseExitCriteria(exitCriteria, facts);

    const nextPhase = await this.prisma.phase.findFirst({
      where: { protocolTemplateId: instance.currentPhase.protocolTemplateId, order: instance.currentPhase.order + 1 },
    });

    if (evaluation.eligible && nextPhase) {
      if (instance.pendingPhaseId !== nextPhase.id) {
        await this.prisma.programInstance.update({
          where: { id: instance.id },
          data: {
            pendingPhaseId: nextPhase.id,
            eligibleSince: new Date(),
            userAcknowledgedAt: null,
            providerAcknowledgedAt: null,
          },
        });
      }
    } else if (instance.pendingPhaseId) {
      // No longer eligible (e.g. a new red flag was logged since the prompt first appeared) —
      // withdraw the pending prompt rather than leave a stale one a patient could still confirm.
      await this.prisma.programInstance.update({
        where: { id: instance.id },
        data: { pendingPhaseId: null, eligibleSince: null, userAcknowledgedAt: null, providerAcknowledgedAt: null },
      });
    }

    return {
      eligible: evaluation.eligible && !!nextPhase,
      results: evaluation.results,
      nextPhase: evaluation.eligible ? nextPhase : null,
    };
  }

  async getStatus(userId: string, programInstanceId: string) {
    const instance = await this.loadInstance(programInstanceId);
    if (instance.userId !== userId) {
      throw new ForbiddenException('Not your program instance');
    }
    const providerRequired = await this.hasActiveProvider(instance.userId);
    return {
      currentPhaseId: instance.currentPhaseId,
      pendingPhaseId: instance.pendingPhaseId,
      eligibleSince: instance.eligibleSince,
      userAcknowledgedAt: instance.userAcknowledgedAt,
      providerAcknowledgedAt: instance.providerAcknowledgedAt,
      providerRequired,
      manualHold: instance.manualHold,
    };
  }

  private async hasActiveProvider(patientId: string): Promise<boolean> {
    const assignment = await this.prisma.providerAssignment.findFirst({
      where: { patientId, active: true },
    });
    return !!assignment;
  }

  /**
   * Records an acknowledgment from whichever party is actually calling (never trusts a
   * client-supplied role) and applies the advancement once every required acknowledgment is in.
   */
  async acknowledge(callingUserId: string, programInstanceId: string) {
    const instance = await this.loadInstance(programInstanceId);

    if (!instance.pendingPhaseId) {
      throw new ForbiddenException('No pending phase advancement to acknowledge');
    }

    const isPatient = instance.userId === callingUserId;
    const isAssignedProvider = isPatient
      ? false
      : !!(await this.prisma.providerAssignment.findFirst({
          where: { patientId: instance.userId, providerId: callingUserId, active: true },
        }));

    if (!isPatient && !isAssignedProvider) {
      throw new ForbiddenException('You are not the patient or an assigned provider for this program instance');
    }

    const data: { userAcknowledgedAt?: Date; providerAcknowledgedAt?: Date } = {};
    if (isPatient && !instance.userAcknowledgedAt) data.userAcknowledgedAt = new Date();
    if (isAssignedProvider && !instance.providerAcknowledgedAt) data.providerAcknowledgedAt = new Date();

    const updated = await this.prisma.programInstance.update({ where: { id: instance.id }, data });

    const providerRequired = await this.hasActiveProvider(instance.userId);
    const apply = shouldApplyAdvancement({
      hasPendingPhase: !!updated.pendingPhaseId,
      userAcknowledged: !!updated.userAcknowledgedAt,
      providerRequired,
      providerAcknowledged: !!updated.providerAcknowledgedAt,
      manualHold: updated.manualHold,
    });

    if (!apply) {
      return this.getStatus(instance.userId, instance.id);
    }

    const writes: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.programInstance.update({
        where: { id: instance.id },
        data: {
          currentPhaseId: updated.pendingPhaseId,
          pendingPhaseId: null,
          eligibleSince: null,
          userAcknowledgedAt: null,
          providerAcknowledgedAt: null,
        },
      }),
    ];
    if (instance.injuryProfileId) {
      writes.push(
        this.prisma.injuryProfile.update({
          where: { id: instance.injuryProfileId },
          data: { currentPhaseId: updated.pendingPhaseId },
        }),
      );
    }
    await this.prisma.$transaction(writes);

    return this.getStatus(instance.userId, instance.id);
  }
}
