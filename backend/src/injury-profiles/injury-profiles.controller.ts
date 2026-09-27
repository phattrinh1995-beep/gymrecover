import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { UsersService } from '../users/users.service.js';
import { InjuryProfilesService } from './injury-profiles.service.js';
import { CreateInjuryProfileDto } from './dto/create-injury-profile.dto.js';

@Controller('injury-profiles')
@UseGuards(JwtAuthGuard)
export class InjuryProfilesController {
  constructor(
    private readonly injuryProfiles: InjuryProfilesService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async findMine(@CurrentUser() authUser: AuthenticatedUser) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.injuryProfiles.findAllForUser(user.id);
  }

  @Post()
  async create(@CurrentUser() authUser: AuthenticatedUser, @Body() dto: CreateInjuryProfileDto) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.injuryProfiles.create(user.id, dto);
  }
}
