import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProgramInstancesService } from '../program-instances/program-instances.service.js';
import { isAnyRedFlagPresent } from './red-flags.js';
import type { RedFlagCheckDto } from './dto/red-flag-check.dto.js';
import type { CompleteSessionDto } from './dto/complete-session.dto.js';

@Injectable()
export class SessionLogsService {
  private readonly logger = new Logger(SessionLogsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly programInstances: ProgramInstancesService,
  ) {}

  /**
   * The red-flag triage gate (build order item 4). Runs before every recovery-track session.
   * Always logs the check as a SessionLog, whether or not it was triggered, so there's a record
   * every time this gate ran. If triggered, the session is blocked (`allowed: false`) — the
   * caller must not offer any way to proceed into the session anyway.
   */
  async runRedFlagCheck(userId: string, dto: RedFlagCheckDto) {
    const { injuryProfileId, ...symptoms } = dto;
    const triggered = isAnyRedFlagPresent(symptoms);

    const programInstance = await this.programInstances.ensureActiveRecoveryInstance(userId, injuryProfileId);

    const sessionLog = await this.prisma.sessionLog.create({
      data: {
        programInstanceId: programInstance.id,
        userId,
        completed: false,
        redFlagTriggered: triggered,
        redFlagDetails: symptoms,
      },
    });

    let notifiedProviderIds: string[] = [];
    if (triggered) {
      const assignments = await this.prisma.providerAssignment.findMany({
        where: { patientId: userId, active: true },
      });
      notifiedProviderIds = assignments.map((a) => a.providerId);

      // No real push/email delivery is wired up yet (Firebase Cloud Messaging / Postmark from the
      // tech stack aren't configured — that needs real project credentials). This log line, plus
      // the provider IDs recorded on the SessionLog below, stand in for that until it exists so
      // the alert isn't silently dropped and there's an auditable record of who should have been
      // notified and when.
      this.logger.warn(
        `Red flag triggered for user ${userId} (session ${sessionLog.id}). Providers to notify: ${
          notifiedProviderIds.length ? notifiedProviderIds.join(', ') : 'none assigned'
        }`,
      );

      if (notifiedProviderIds.length > 0) {
        await this.prisma.sessionLog.update({
          where: { id: sessionLog.id },
          data: { redFlagDetails: { ...symptoms, notifiedProviderIds } },
        });
      }
    }

    return {
      allowed: !triggered,
      sessionLogId: sessionLog.id,
      programInstanceId: programInstance.id,
      notifiedProviderIds,
    };
  }

  /** Starts a performance-track session (build order item 9). No red-flag checklist here — that
   * gate is specifically for the recovery track (build order item 4); a healthy gym member
   * doesn't get a surgical-recovery symptom checklist in front of a workout. Still produces an
   * ordinary SessionLog so completion, pain score, and RPE logging (build order item 6) works
   * identically for both tracks. */
  async startPerformanceSession(userId: string, programInstanceId: string) {
    const instance = await this.prisma.programInstance.findUnique({ where: { id: programInstanceId } });
    if (!instance || instance.userId !== userId) {
      throw new NotFoundException('Program instance not found');
    }
    if (instance.track !== 'PERFORMANCE') {
      throw new ForbiddenException('This is not a performance-track program instance');
    }

    const sessionLog = await this.prisma.sessionLog.create({
      data: { programInstanceId: instance.id, userId, completed: false },
    });
    return { sessionLogId: sessionLog.id, programInstanceId: instance.id };
  }

  /** Logs completion detail for an already-created SessionLog (build order item 6): per-exercise
   * results, pain score (0-10), and RPE (1-10). The SessionLog itself was created by the red-flag
   * check that must run before it — this only fills in what happened during the session. */
  async completeSession(userId: string, sessionLogId: string, dto: CompleteSessionDto) {
    const sessionLog = await this.prisma.sessionLog.findUnique({ where: { id: sessionLogId } });
    if (!sessionLog) throw new NotFoundException('Session log not found');
    if (sessionLog.userId !== userId) throw new ForbiddenException('Not your session log');
    if (sessionLog.redFlagTriggered) {
      throw new ForbiddenException('This session was blocked by the red-flag check and cannot be completed');
    }

    return this.prisma.sessionLog.update({
      where: { id: sessionLogId },
      data: {
        completed: true,
        completedAt: new Date(),
        painScore: dto.painScore,
        rpe: dto.rpe,
        exerciseResults: dto.exerciseResults as unknown as object,
      },
    });
  }
}
