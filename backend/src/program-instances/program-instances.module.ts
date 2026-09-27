import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { ProgramInstancesService } from './program-instances.service.js';
import { ProgramInstancesController } from './program-instances.controller.js';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ProgramInstancesController],
  providers: [ProgramInstancesService],
  exports: [ProgramInstancesService],
})
export class ProgramInstancesModule {}
