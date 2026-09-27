import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ManualAdvanceDto {
  @IsUUID()
  targetPhaseId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
