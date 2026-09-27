import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { UsersService } from '../users/users.service.js';
import { ProviderPortalService } from './provider-portal.service.js';
import { PlaceHoldDto } from './dto/hold.dto.js';
import { ManualAdvanceDto } from './dto/manual-advance.dto.js';

@Controller('provider')
@UseGuards(JwtAuthGuard)
export class ProviderPortalController {
  constructor(
    private readonly providerPortal: ProviderPortalService,
    private readonly usersService: UsersService,
  ) {}

  @Get('patients')
  async listPatients(@CurrentUser() authUser: AuthenticatedUser) {
    const provider = await this.usersService.findOrCreateBySubject(authUser);
    return this.providerPortal.listMyPatients(provider.id);
  }

  @Get('patients/:patientId')
  async getPatient(@CurrentUser() authUser: AuthenticatedUser, @Param('patientId') patientId: string) {
    const provider = await this.usersService.findOrCreateBySubject(authUser);
    return this.providerPortal.getPatientDetail(provider.id, patientId);
  }

  @Get('patients/:patientId/red-flag-alerts')
  async getRedFlagAlerts(@CurrentUser() authUser: AuthenticatedUser, @Param('patientId') patientId: string) {
    const provider = await this.usersService.findOrCreateBySubject(authUser);
    return this.providerPortal.getRedFlagAlerts(provider.id, patientId);
  }

  @Post('patients/:patientId/program-instances/:instanceId/hold')
  async placeHold(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Param('instanceId') instanceId: string,
    @Body() dto: PlaceHoldDto,
  ) {
    const provider = await this.usersService.findOrCreateBySubject(authUser);
    return this.providerPortal.placeHold(provider.id, patientId, instanceId, dto.reason);
  }

  @Post('patients/:patientId/program-instances/:instanceId/release-hold')
  async releaseHold(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Param('instanceId') instanceId: string,
  ) {
    const provider = await this.usersService.findOrCreateBySubject(authUser);
    return this.providerPortal.releaseHold(provider.id, patientId, instanceId);
  }

  @Post('patients/:patientId/program-instances/:instanceId/advance')
  async manuallyAdvance(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Param('instanceId') instanceId: string,
    @Body() dto: ManualAdvanceDto,
  ) {
    const provider = await this.usersService.findOrCreateBySubject(authUser);
    return this.providerPortal.manuallySetPhase(provider.id, patientId, instanceId, dto.targetPhaseId, dto.reason);
  }
}
