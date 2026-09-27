import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EncryptionService } from '../common/encryption/encryption.service.js';
import { getPromDefinition, promTypeForRegion, type PromDefinition } from './prom-definitions.js';
import { scoreForDefinition } from './scoring.js';
import type { SubmitOutcomeAssessmentDto } from './dto/submit-outcome-assessment.dto.js';

@Injectable()
export class OutcomeAssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  private async getInjuryProfileOwnedBy(userId: string, injuryProfileId: string) {
    const injuryProfile = await this.prisma.injuryProfile.findUnique({ where: { id: injuryProfileId } });
    if (!injuryProfile || injuryProfile.userId !== userId) {
      throw new NotFoundException('Injury profile not found');
    }
    return injuryProfile;
  }

  /** Which PROM (if any) applies to this injury profile, and its (placeholder) question set. */
  async getDefinitionFor(userId: string, injuryProfileId: string): Promise<PromDefinition> {
    const injuryProfile = await this.getInjuryProfileOwnedBy(userId, injuryProfileId);
    const type = promTypeForRegion(injuryProfile.region);
    if (!type) {
      throw new BadRequestException(`No standardized outcome measure is configured for region ${injuryProfile.region} yet`);
    }
    return getPromDefinition(type);
  }

  async submit(userId: string, dto: SubmitOutcomeAssessmentDto) {
    const injuryProfile = await this.getInjuryProfileOwnedBy(userId, dto.injuryProfileId);
    const type = promTypeForRegion(injuryProfile.region);
    if (!type) {
      throw new BadRequestException(`No standardized outcome measure is configured for region ${injuryProfile.region} yet`);
    }
    const definition = getPromDefinition(type);

    for (const q of definition.questions) {
      const value = dto.answers[q.id];
      if (typeof value !== 'number' || value < q.min || value > q.max) {
        throw new BadRequestException(`Answer for "${q.id}" must be a number between ${q.min} and ${q.max}`);
      }
    }

    if (dto.programInstanceId) {
      const instance = await this.prisma.programInstance.findUnique({ where: { id: dto.programInstanceId } });
      if (!instance || instance.userId !== userId) {
        throw new ForbiddenException('Not your program instance');
      }
    }

    const score = scoreForDefinition(definition, dto.answers);

    return this.prisma.outcomeAssessment.create({
      data: {
        userId,
        programInstanceId: dto.programInstanceId,
        type,
        score,
        rawAnswers: this.encryption.encryptJson(dto.answers),
      },
    });
  }

  /** Score + date trend for charting — deliberately doesn't decrypt rawAnswers, since a trend
   * view never needs the individual item responses. */
  async listForUser(userId: string) {
    const assessments = await this.prisma.outcomeAssessment.findMany({
      where: { userId },
      orderBy: { assessedAt: 'asc' },
      select: { id: true, type: true, score: true, assessedAt: true },
    });
    return assessments;
  }
}
