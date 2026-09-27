import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { UsersService } from '../users/users.service.js';
import { ProgramInstancesService } from './program-instances.service.js';
import { StartPerformanceProgramDto } from './dto/start-performance-program.dto.js';
import { GraduateDto } from './dto/graduate.dto.js';

@Controller('program-instances')
@UseGuards(JwtAuthGuard)
export class ProgramInstancesController {
  constructor(
    private readonly programInstances: ProgramInstancesService,
    private readonly usersService: UsersService,
  ) {}

  @Get(':id/today-session')
  async todaySession(@CurrentUser() authUser: AuthenticatedUser, @Param('id') id: string) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.programInstances.getTodaySession(user.id, id);
  }

  @Post('performance')
  async startPerformanceProgram(@CurrentUser() authUser: AuthenticatedUser, @Body() dto: StartPerformanceProgramDto) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.programInstances.startPerformanceProgram(user.id, dto.goal);
  }

  @Post(':id/graduate')
  async graduate(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: GraduateDto,
  ) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.programInstances.graduateToPerformance(user.id, id, dto.performanceGoal);
  }
}
