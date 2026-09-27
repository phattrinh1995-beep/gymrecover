import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsUUID, Max, Min, ValidateNested } from 'class-validator';

export class ExerciseResultDto {
  @IsUUID()
  phaseExerciseId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  setsCompleted?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  repsCompleted?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  holdSecondsCompleted?: number;
}

export class CompleteSessionDto {
  @IsInt()
  @Min(0)
  @Max(10)
  painScore!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  rpe!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseResultDto)
  exerciseResults!: ExerciseResultDto[];
}
