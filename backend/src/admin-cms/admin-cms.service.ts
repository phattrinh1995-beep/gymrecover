import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateProtocolTemplateDto, UpdateProtocolTemplateDto } from './dto/protocol-template.dto.js';
import type { CreatePhaseDto, UpdatePhaseDto } from './dto/phase.dto.js';
import type { CreateExerciseDto, UpdateExerciseDto } from './dto/exercise.dto.js';
import type { CreatePhaseExerciseDto, UpdatePhaseExerciseDto } from './dto/phase-exercise.dto.js';
import type {
  CreatePerformanceProgramTemplateDto,
  UpdatePerformanceProgramTemplateDto,
} from './dto/performance-program.dto.js';
import type {
  CreatePerformanceProgramExerciseDto,
  UpdatePerformanceProgramExerciseDto,
} from './dto/performance-program-exercise.dto.js';

/** Prisma throws P2003 (foreign key violation) when deleting a row something else still
 * references (e.g. an Exercise still used in a PhaseExercise, since that relation is
 * onDelete: Restrict). Surfaced as a clear 409 instead of a raw DB error. */
function rethrowAsConflict(err: unknown, message: string): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
    throw new ConflictException(message);
  }
  throw err;
}

@Injectable()
export class AdminCmsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Protocol templates ----------

  listProtocolTemplates() {
    return this.prisma.protocolTemplate.findMany({ orderBy: { name: 'asc' } });
  }

  async getProtocolTemplate(id: string) {
    const template = await this.prisma.protocolTemplate.findUnique({
      where: { id },
      include: {
        phases: {
          orderBy: { order: 'asc' },
          include: { phaseExercises: { orderBy: { order: 'asc' }, include: { exercise: true } } },
        },
      },
    });
    if (!template) throw new NotFoundException('Protocol template not found');
    return template;
  }

  createProtocolTemplate(dto: CreateProtocolTemplateDto) {
    return this.prisma.protocolTemplate.create({ data: dto });
  }

  async updateProtocolTemplate(id: string, dto: UpdateProtocolTemplateDto) {
    await this.getProtocolTemplate(id);
    return this.prisma.protocolTemplate.update({ where: { id }, data: dto });
  }

  async deleteProtocolTemplate(id: string) {
    await this.getProtocolTemplate(id);
    try {
      return await this.prisma.protocolTemplate.delete({ where: { id } });
    } catch (err) {
      rethrowAsConflict(err, 'This protocol template is in use by an active program instance and cannot be deleted.');
    }
  }

  // ---------- Phases ----------

  async createPhase(protocolTemplateId: string, dto: CreatePhaseDto) {
    await this.getProtocolTemplate(protocolTemplateId);
    const clash = await this.prisma.phase.findUnique({
      where: { protocolTemplateId_order: { protocolTemplateId, order: dto.order } },
    });
    if (clash) throw new ConflictException(`Phase order ${dto.order} is already used in this template`);
    return this.prisma.phase.create({
      data: {
        protocolTemplateId,
        order: dto.order,
        name: dto.name,
        description: dto.description,
        entryCriteria: dto.entryCriteria as Prisma.InputJsonValue,
        exitCriteria: dto.exitCriteria as Prisma.InputJsonValue,
      },
    });
  }

  async updatePhase(id: string, dto: UpdatePhaseDto) {
    const phase = await this.prisma.phase.findUnique({ where: { id } });
    if (!phase) throw new NotFoundException('Phase not found');
    if (dto.order !== undefined && dto.order !== phase.order) {
      const clash = await this.prisma.phase.findUnique({
        where: { protocolTemplateId_order: { protocolTemplateId: phase.protocolTemplateId, order: dto.order } },
      });
      if (clash) throw new ConflictException(`Phase order ${dto.order} is already used in this template`);
    }
    return this.prisma.phase.update({
      where: { id },
      data: {
        order: dto.order,
        name: dto.name,
        description: dto.description,
        entryCriteria: dto.entryCriteria as Prisma.InputJsonValue | undefined,
        exitCriteria: dto.exitCriteria as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async deletePhase(id: string) {
    const phase = await this.prisma.phase.findUnique({ where: { id } });
    if (!phase) throw new NotFoundException('Phase not found');
    try {
      return await this.prisma.phase.delete({ where: { id } });
    } catch (err) {
      rethrowAsConflict(err, 'This phase is referenced by an active program instance and cannot be deleted.');
    }
  }

  // ---------- Phase exercises (prescription join) ----------

  async addExerciseToPhase(phaseId: string, dto: CreatePhaseExerciseDto) {
    const phase = await this.prisma.phase.findUnique({ where: { id: phaseId } });
    if (!phase) throw new NotFoundException('Phase not found');
    const exercise = await this.prisma.exercise.findUnique({ where: { id: dto.exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const existing = await this.prisma.phaseExercise.findUnique({
      where: { phaseId_exerciseId: { phaseId, exerciseId: dto.exerciseId } },
    });
    if (existing) throw new ConflictException('This exercise is already assigned to this phase');

    return this.prisma.phaseExercise.create({
      data: {
        phaseId,
        exerciseId: dto.exerciseId,
        order: dto.order,
        sets: dto.sets,
        reps: dto.reps,
        holdTimeSeconds: dto.holdTimeSeconds,
        notes: dto.notes,
      },
      include: { exercise: true },
    });
  }

  async updatePhaseExercise(id: string, dto: UpdatePhaseExerciseDto) {
    const existing = await this.prisma.phaseExercise.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Phase exercise not found');
    return this.prisma.phaseExercise.update({ where: { id }, data: dto, include: { exercise: true } });
  }

  async removeExerciseFromPhase(id: string) {
    const existing = await this.prisma.phaseExercise.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Phase exercise not found');
    return this.prisma.phaseExercise.delete({ where: { id } });
  }

  // ---------- Exercise catalog ----------

  listExercises() {
    return this.prisma.exercise.findMany({ orderBy: { name: 'asc' } });
  }

  createExercise(dto: CreateExerciseDto) {
    return this.prisma.exercise.create({ data: dto });
  }

  async updateExercise(id: string, dto: UpdateExerciseDto) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return this.prisma.exercise.update({ where: { id }, data: dto });
  }

  async deleteExercise(id: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    try {
      return await this.prisma.exercise.delete({ where: { id } });
    } catch (err) {
      rethrowAsConflict(err, 'This exercise is used in one or more phases/programs and cannot be deleted.');
    }
  }

  // ---------- Performance program templates (build order item 9's content, editable here too) ----------

  listPerformanceProgramTemplates() {
    return this.prisma.performanceProgramTemplate.findMany({ orderBy: { name: 'asc' } });
  }

  async getPerformanceProgramTemplate(id: string) {
    const template = await this.prisma.performanceProgramTemplate.findUnique({
      where: { id },
      include: { exercises: { orderBy: { order: 'asc' }, include: { exercise: true } } },
    });
    if (!template) throw new NotFoundException('Performance program template not found');
    return template;
  }

  createPerformanceProgramTemplate(dto: CreatePerformanceProgramTemplateDto) {
    return this.prisma.performanceProgramTemplate.create({ data: dto });
  }

  async updatePerformanceProgramTemplate(id: string, dto: UpdatePerformanceProgramTemplateDto) {
    await this.getPerformanceProgramTemplate(id);
    return this.prisma.performanceProgramTemplate.update({ where: { id }, data: dto });
  }

  async deletePerformanceProgramTemplate(id: string) {
    await this.getPerformanceProgramTemplate(id);
    try {
      return await this.prisma.performanceProgramTemplate.delete({ where: { id } });
    } catch (err) {
      rethrowAsConflict(err, 'This performance program template is in use by an active program instance and cannot be deleted.');
    }
  }

  async addExerciseToPerformanceProgram(templateId: string, dto: CreatePerformanceProgramExerciseDto) {
    await this.getPerformanceProgramTemplate(templateId);
    const exercise = await this.prisma.exercise.findUnique({ where: { id: dto.exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const existing = await this.prisma.performanceProgramExercise.findUnique({
      where: { templateId_exerciseId: { templateId, exerciseId: dto.exerciseId } },
    });
    if (existing) throw new ConflictException('This exercise is already assigned to this program');

    return this.prisma.performanceProgramExercise.create({
      data: {
        templateId,
        exerciseId: dto.exerciseId,
        order: dto.order,
        sets: dto.sets,
        reps: dto.reps,
        holdTimeSeconds: dto.holdTimeSeconds,
        notes: dto.notes,
      },
      include: { exercise: true },
    });
  }

  async updatePerformanceProgramExercise(id: string, dto: UpdatePerformanceProgramExerciseDto) {
    const existing = await this.prisma.performanceProgramExercise.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Performance program exercise not found');
    return this.prisma.performanceProgramExercise.update({ where: { id }, data: dto, include: { exercise: true } });
  }

  async removeExerciseFromPerformanceProgram(id: string) {
    const existing = await this.prisma.performanceProgramExercise.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Performance program exercise not found');
    return this.prisma.performanceProgramExercise.delete({ where: { id } });
  }
}
