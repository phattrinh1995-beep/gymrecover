import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { UsersService } from '../users/users.service.js';
import { ProgramEngineService } from './program-engine.service.js';

@Controller('program-engine/instances/:programInstanceId')
@UseGuards(JwtAuthGuard)
export class ProgramEngineController {
  constructor(
    private readonly engine: ProgramEngineService,
    private readonly usersService: UsersService,
  ) {}

  /** Called by the mobile app after each session (build order item 5). */
  @Post('check-eligibility')
  async checkEligibility(@CurrentUser() authUser: AuthenticatedUser, @Param('programInstanceId') id: string) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.engine.checkEligibility(user.id, id);
  }

  @Get()
  async status(@CurrentUser() authUser: AuthenticatedUser, @Param('programInstanceId') id: string) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.engine.getStatus(user.id, id);
  }

  /** Called by either the patient or their assigned provider — the caller's role is derived
   * server-side from who they actually are, never trusted from the request. */
  @Post('acknowledge')
  async acknowledge(@CurrentUser() authUser: AuthenticatedUser, @Param('programInstanceId') id: string) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.engine.acknowledge(user.id, id);
  }
}
