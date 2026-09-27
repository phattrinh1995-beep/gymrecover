import { PerformanceGoal } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class StartPerformanceProgramDto {
  @IsEnum(PerformanceGoal)
  goal!: PerformanceGoal;
}
