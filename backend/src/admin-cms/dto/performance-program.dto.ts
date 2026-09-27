import { PerformanceGoal } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePerformanceProgramTemplateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @IsEnum(PerformanceGoal)
  goal!: PerformanceGoal;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdatePerformanceProgramTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsEnum(PerformanceGoal)
  goal?: PerformanceGoal;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
