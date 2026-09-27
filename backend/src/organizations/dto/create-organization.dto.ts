import { OrganizationType } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsEnum(OrganizationType)
  type!: OrganizationType;
}
