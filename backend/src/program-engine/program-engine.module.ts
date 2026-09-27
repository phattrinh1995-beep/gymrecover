import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { ProgramEngineService } from './program-engine.service.js';
import { ProgramEngineController } from './program-engine.controller.js';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ProgramEngineController],
  providers: [ProgramEngineService],
  exports: [ProgramEngineService],
})
export class ProgramEngineModule {}
