import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { UsersService, requiresClearanceConfirmation } from './users.service.js';
import { UpsertProfileDto } from './dto/upsert-profile.dto.js';

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getMe(@CurrentUser() authUser: AuthenticatedUser) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    const activeProgramInstances = await this.usersService.getActiveProgramInstances(user.id);
    return {
      ...user,
      requiresClearanceConfirmation: requiresClearanceConfirmation(user.injuryProfiles),
      activeProgramInstances,
    };
  }

  @Patch('profile')
  async upsertProfile(@CurrentUser() authUser: AuthenticatedUser, @Body() dto: UpsertProfileDto) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.usersService.upsertProfile(user.id, dto);
  }
}
