import { OrgInviteRole } from '@prisma/client';
import { IsEmail, IsEnum } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsEnum(OrgInviteRole)
  role!: OrgInviteRole;
}
