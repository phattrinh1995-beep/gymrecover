import { ClearanceStatus, InjuryRegion, Side } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class CreateInjuryProfileDto {
  @IsEnum(InjuryRegion)
  region!: InjuryRegion;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  diagnosisText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  diagnosisCategory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  surgeryType?: string;

  @IsOptional()
  @IsDateString()
  surgeryDate?: string;

  @IsEnum(Side)
  side!: Side;

  // Required whenever surgeryDate is present — the mobile intake flow will not let a user reach
  // this step without answering the clearance question first (build order item 3).
  @ValidateIf((dto: CreateInjuryProfileDto) => !!dto.surgeryDate)
  @IsEnum(ClearanceStatus)
  clearanceStatus?: ClearanceStatus;
}
