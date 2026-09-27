import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { EncryptionModule } from './common/encryption/encryption.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { InjuryProfilesModule } from './injury-profiles/injury-profiles.module.js';
import { ProgramInstancesModule } from './program-instances/program-instances.module.js';
import { SessionLogsModule } from './session-logs/session-logs.module.js';
import { ProgramEngineModule } from './program-engine/program-engine.module.js';
import { OutcomeAssessmentsModule } from './outcome-assessments/outcome-assessments.module.js';
import { ProviderPortalModule } from './provider-portal/provider-portal.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { AdminCmsModule } from './admin-cms/admin-cms.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EncryptionModule,
    AuthModule,
    UsersModule,
    InjuryProfilesModule,
    ProgramInstancesModule,
    SessionLogsModule,
    ProgramEngineModule,
    OutcomeAssessmentsModule,
    ProviderPortalModule,
    OrganizationsModule,
    AdminCmsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
