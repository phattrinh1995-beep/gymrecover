import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProgramInstancesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Minimal bridge so recovery-track features (like the red-flag gate) have a ProgramInstance to
   * attach SessionLogs to, ahead of the Adaptive Program Engine (build order item 5) actually
   * managing phase assignment/advancement. This does NOT evaluate any criteria or pick a phase
   * beyond "phase 1" — it just enrolls the user in the first active protocol template matching
   * their injury's region, if they aren't already enrolled. Phase advancement logic belongs
   * entirely to the engine, not here.
   */
  async ensureActiveRecoveryInstance(userId: string, injuryProfileId: string) {
    const existing = await this.prisma.programInstance.findFirst({
      where: { userId, injuryProfileId, track: 'RECOVERY', status: 'ACTIVE' },
    });
    if (existing) return existing;

    const injuryProfile = await this.prisma.injuryProfile.findUnique({ where: { id: injuryProfileId } });
    if (!injuryProfile || injuryProfile.userId !== userId) {
      throw new NotFoundException('Injury profile not found');
    }
    // Defense-in-depth alongside the mobile UI's own gating (build order item 3): recovery
    // content — including a session to run the red-flag gate in front of — must not exist for an
    // uncleared surgical injury, regardless of what the client sends.
    if (injuryProfile.surgeryDate && injuryProfile.clearanceStatus === 'PENDING') {
      throw new ForbiddenException('Exercise clearance has not been confirmed for this injury profile');
    }

    const template = await this.prisma.protocolTemplate.findFirst({
      where: { region: injuryProfile.region, isActive: true },
      include: { phases: { orderBy: { order: 'asc' }, take: 1 } },
    });
    const firstPhase = template?.phases[0];

    return this.prisma.programInstance.create({
      data: {
        userId,
        track: 'RECOVERY',
        status: 'ACTIVE',
        injuryProfileId,
        protocolTemplateId: template?.id,
        currentPhaseId: firstPhase?.id,
      },
    });
  }

  /** The exercise list for a program instance's current content — the current recovery phase, or
   * the performance program template for the performance track (build order items 6 and 9). Same
   * response shape either way, so the mobile session screen doesn't need to know which track it's
   * looking at. */
  async getTodaySession(userId: string, programInstanceId: string) {
    const instance = await this.prisma.programInstance.findUnique({
      where: { id: programInstanceId },
      include: {
        currentPhase: {
          include: { phaseExercises: { orderBy: { order: 'asc' }, include: { exercise: true } } },
        },
        performanceProgramTemplate: {
          include: { exercises: { orderBy: { order: 'asc' }, include: { exercise: true } } },
        },
      },
    });
    if (!instance) throw new NotFoundException('Program instance not found');
    if (instance.userId !== userId) throw new ForbiddenException('Not your program instance');

    const source =
      instance.track === 'PERFORMANCE'
        ? { name: instance.performanceProgramTemplate?.name ?? null, items: instance.performanceProgramTemplate?.exercises ?? [] }
        : { name: instance.currentPhase?.name ?? null, items: instance.currentPhase?.phaseExercises ?? [] };

    return {
      phaseName: source.name,
      phaseExercises: source.items.map((item) => ({
        id: item.id,
        order: item.order,
        sets: item.sets,
        reps: item.reps,
        holdTimeSeconds: item.holdTimeSeconds,
        notes: item.notes,
        exercise: {
          id: item.exercise.id,
          name: item.exercise.name,
          description: item.exercise.description,
          videoUrl: item.exercise.videoUrl,
          imageUrl: item.exercise.imageUrl,
        },
      })),
    };
  }

  /** Enrolls the user in a performance-track program for the given goal (build order item 9).
   * Reuses an existing active performance instance for that same goal if one exists. */
  async startPerformanceProgram(userId: string, goal: 'STRENGTH' | 'HYPERTROPHY' | 'CONDITIONING') {
    const existing = await this.prisma.programInstance.findFirst({
      where: { userId, track: 'PERFORMANCE', status: 'ACTIVE', performanceGoal: goal },
    });
    if (existing) return existing;

    const template = await this.prisma.performanceProgramTemplate.findFirst({
      where: { goal, isActive: true },
    });
    if (!template) {
      throw new NotFoundException(`No active performance program template configured for goal ${goal}`);
    }

    return this.prisma.programInstance.create({
      data: {
        userId,
        track: 'PERFORMANCE',
        status: 'ACTIVE',
        performanceGoal: goal,
        performanceProgramTemplateId: template.id,
      },
    });
  }

  /** Transitions a recovery-track user into the performance track (build order item 9's
   * "graduate" action). Marks the recovery instance COMPLETED and links the new performance
   * instance back to it via graduatedFromId — it does not delete or hide the recovery history. */
  async graduateToPerformance(
    userId: string,
    recoveryInstanceId: string,
    goal: 'STRENGTH' | 'HYPERTROPHY' | 'CONDITIONING',
  ) {
    const recoveryInstance = await this.prisma.programInstance.findUnique({ where: { id: recoveryInstanceId } });
    if (!recoveryInstance || recoveryInstance.userId !== userId) {
      throw new NotFoundException('Recovery program instance not found');
    }
    if (recoveryInstance.track !== 'RECOVERY') {
      throw new ForbiddenException('Only a recovery-track program instance can graduate to performance');
    }

    const template = await this.prisma.performanceProgramTemplate.findFirst({ where: { goal, isActive: true } });
    if (!template) {
      throw new NotFoundException(`No active performance program template configured for goal ${goal}`);
    }

    const [, performanceInstance] = await this.prisma.$transaction([
      this.prisma.programInstance.update({
        where: { id: recoveryInstanceId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      }),
      this.prisma.programInstance.create({
        data: {
          userId,
          track: 'PERFORMANCE',
          status: 'ACTIVE',
          performanceGoal: goal,
          performanceProgramTemplateId: template.id,
          graduatedFromId: recoveryInstanceId,
        },
      }),
    ]);

    return performanceInstance;
  }
}
