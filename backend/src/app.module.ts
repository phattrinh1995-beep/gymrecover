import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
    // Global API rate limit: 100 requests per IP per minute across every endpoint. Sized for
    // normal interactive use (mobile/web polling + a session's worth of writes) while still
    // blocking brute-force/scripted abuse; tighten per-route with @Throttle() if a specific
    // endpoint (e.g. once real Auth0 login lands) needs a stricter limit.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
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
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
