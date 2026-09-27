import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { UsersService } from '../users/users.service.js';
import { OutcomeAssessmentsService } from './outcome-assessments.service.js';
import { SubmitOutcomeAssessmentDto } from './dto/submit-outcome-assessment.dto.js';

@Controller('outcome-assessments')
@UseGuards(JwtAuthGuard)
export class OutcomeAssessmentsController {
  constructor(
    private readonly outcomeAssessments: OutcomeAssessmentsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('definition')
  async getDefinition(@CurrentUser() authUser: AuthenticatedUser, @Query('injuryProfileId') injuryProfileId: string) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.outcomeAssessments.getDefinitionFor(user.id, injuryProfileId);
  }

  @Post()
  async submit(@CurrentUser() authUser: AuthenticatedUser, @Body() dto: SubmitOutcomeAssessmentDto) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.outcomeAssessments.submit(user.id, dto);
  }

  @Get()
  async list(@CurrentUser() authUser: AuthenticatedUser) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.outcomeAssessments.listForUser(user.id);
  }
}
