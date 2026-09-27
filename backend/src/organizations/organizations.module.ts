import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { OrganizationsService } from './organizations.service.js';
import { OrganizationsController } from './organizations.controller.js';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
