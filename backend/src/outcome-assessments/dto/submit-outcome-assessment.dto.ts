import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class SubmitOutcomeAssessmentDto {
  @IsUUID()
  injuryProfileId!: string;

  @IsOptional()
  @IsUUID()
  programInstanceId?: string;

  /** Answers keyed by question id, e.g. { "pain": 3, "symptoms": 2, ... } */
  @IsObject()
  answers!: Record<string, number>;
}
