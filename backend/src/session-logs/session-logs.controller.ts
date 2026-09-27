import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { UsersService } from '../users/users.service.js';
import { SessionLogsService } from './session-logs.service.js';
import { RedFlagCheckDto } from './dto/red-flag-check.dto.js';
import { CompleteSessionDto } from './dto/complete-session.dto.js';
import { StartPerformanceSessionDto } from './dto/start-performance-session.dto.js';

@Controller('session-logs')
@UseGuards(JwtAuthGuard)
export class SessionLogsController {
  constructor(
    private readonly sessionLogs: SessionLogsService,
    private readonly usersService: UsersService,
  ) {}

  @Post('red-flag-check')
  async redFlagCheck(@CurrentUser() authUser: AuthenticatedUser, @Body() dto: RedFlagCheckDto) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.sessionLogs.runRedFlagCheck(user.id, dto);
  }

  @Post('start-performance-session')
  async startPerformanceSession(@CurrentUser() authUser: AuthenticatedUser, @Body() dto: StartPerformanceSessionDto) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.sessionLogs.startPerformanceSession(user.id, dto.programInstanceId);
  }

  @Patch(':id/complete')
  async complete(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CompleteSessionDto,
  ) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.sessionLogs.completeSession(user.id, id, dto);
  }
}
