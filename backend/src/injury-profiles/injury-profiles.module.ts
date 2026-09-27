import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { InjuryProfilesService } from './injury-profiles.service.js';
import { InjuryProfilesController } from './injury-profiles.controller.js';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [InjuryProfilesController],
  providers: [InjuryProfilesService],
})
export class InjuryProfilesModule {}
