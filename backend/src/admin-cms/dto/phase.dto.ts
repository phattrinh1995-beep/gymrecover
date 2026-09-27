import { IsInt, IsObject, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreatePhaseDto {
  @IsInt()
  @Min(1)
  order!: number;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  entryCriteria!: Record<string, unknown>;

  @IsObject()
  exitCriteria!: Record<string, unknown>;
}

export class UpdatePhaseDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  entryCriteria?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  exitCriteria?: Record<string, unknown>;
}
