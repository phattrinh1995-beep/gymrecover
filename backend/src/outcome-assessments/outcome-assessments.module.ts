import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { OutcomeAssessmentsService } from './outcome-assessments.service.js';
import { OutcomeAssessmentsController } from './outcome-assessments.controller.js';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [OutcomeAssessmentsController],
  providers: [OutcomeAssessmentsService],
})
export class OutcomeAssessmentsModule {}
