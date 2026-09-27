import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePerformanceProgramExerciseDto {
  @IsUUID()
  exerciseId!: string;

  @IsInt()
  @Min(1)
  order!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sets?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  holdTimeSeconds?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePerformanceProgramExerciseDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sets?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  holdTimeSeconds?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
