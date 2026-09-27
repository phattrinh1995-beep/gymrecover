import { InjuryRegion } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProtocolTemplateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @IsEnum(InjuryRegion)
  region!: InjuryRegion;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  // Deliberately required, not defaulted here — an admin creating real content must explicitly
  // state review status rather than silently inheriting the schema's placeholder default.
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reviewedBy!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  sourceCitation?: string;
}

export class UpdateProtocolTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsEnum(InjuryRegion)
  region?: InjuryRegion;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reviewedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  sourceCitation?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
