import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EncryptionService } from '../common/encryption/encryption.service.js';
import type { CreateInjuryProfileDto } from './dto/create-injury-profile.dto.js';

@Injectable()
export class InjuryProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  async create(userId: string, dto: CreateInjuryProfileDto) {
    return this.prisma.injuryProfile.create({
      data: {
        userId,
        region: dto.region,
        diagnosisText: dto.diagnosisText ? this.encryption.encrypt(dto.diagnosisText) : undefined,
        diagnosisCategory: dto.diagnosisCategory,
        surgeryType: dto.surgeryType,
        surgeryDate: dto.surgeryDate ? new Date(dto.surgeryDate) : undefined,
        side: dto.side,
        clearanceStatus: dto.clearanceStatus,
      },
    });
  }

  async findAllForUser(userId: string) {
    const profiles = await this.prisma.injuryProfile.findMany({ where: { userId } });
    return profiles.map((p) => ({
      ...p,
      diagnosisText: p.diagnosisText ? this.encryption.decrypt(p.diagnosisText) : null,
    }));
  }
}
