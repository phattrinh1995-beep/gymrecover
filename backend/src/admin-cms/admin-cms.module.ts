import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminCmsService } from './admin-cms.service.js';
import { AdminCmsController } from './admin-cms.controller.js';
import { AdminCmsGuard } from './admin-cms.guard.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminCmsController],
  providers: [AdminCmsService, AdminCmsGuard],
})
export class AdminCmsModule {}
