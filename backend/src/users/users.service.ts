import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpsertProfileDto } from './dto/upsert-profile.dto.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';

/** True if the user has a surgical injury profile whose clearance question hasn't been
 * answered with a real confirmation yet — recovery content must stay hidden until this is
 * false (build order item 3). */
export function requiresClearanceConfirmation(
  injuryProfiles: { surgeryDate: Date | null; clearanceStatus: string }[],
): boolean {
  return injuryProfiles.some((injury) => injury.surgeryDate !== null && injury.clearanceStatus === 'PENDING');
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Just-in-time provisioning: the first authenticated request for a given Auth0 subject
   * creates the local User row. There is no separate "sign up" endpoint — identity lives in
   * Auth0, this just mirrors it locally. */
  async findOrCreateBySubject(authUser: AuthenticatedUser) {
    return this.prisma.user.upsert({
      where: { authSubjectId: authUser.sub },
      create: { authSubjectId: authUser.sub, email: authUser.email },
      update: {},
      include: { profile: true, injuryProfiles: true },
    });
  }

  async getActiveProgramInstances(userId: string) {
    return this.prisma.programInstance.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { id: true, track: true, performanceGoal: true },
    });
  }

  async upsertProfile(userId: string, dto: UpsertProfileDto) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        goals: dto.goals,
        activityLevel: dto.activityLevel,
      },
      update: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        goals: dto.goals,
        activityLevel: dto.activityLevel,
      },
    });
  }
}
