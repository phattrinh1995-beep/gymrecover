import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { ProgramInstancesModule } from '../program-instances/program-instances.module.js';
import { SessionLogsService } from './session-logs.service.js';
import { SessionLogsController } from './session-logs.controller.js';

@Module({
  imports: [AuthModule, UsersModule, ProgramInstancesModule],
  controllers: [SessionLogsController],
  providers: [SessionLogsService],
})
export class SessionLogsModule {}
