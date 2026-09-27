import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { ProviderPortalService } from './provider-portal.service.js';
import { ProviderPortalController } from './provider-portal.controller.js';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ProviderPortalController],
  providers: [ProviderPortalService],
})
export class ProviderPortalModule {}
