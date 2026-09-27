import { PerformanceGoal } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class GraduateDto {
  @IsEnum(PerformanceGoal)
  performanceGoal!: PerformanceGoal;
}
