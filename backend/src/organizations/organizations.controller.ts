import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { UsersService } from '../users/users.service.js';
import { OrganizationsService } from './organizations.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { CreateInviteDto } from './dto/create-invite.dto.js';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(
    private readonly organizations: OrganizationsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@CurrentUser() authUser: AuthenticatedUser, @Body() dto: CreateOrganizationDto) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.organizations.createOrganization(user.id, dto);
  }

  @Get('mine')
  async mine(@CurrentUser() authUser: AuthenticatedUser) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.organizations.getMyOrganization(user.id);
  }

  @Post(':id/invites')
  async createInvite(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateInviteDto,
  ) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.organizations.createInvite(user.id, id, dto);
  }

  @Post('invites/:inviteId/revoke')
  async revokeInvite(@CurrentUser() authUser: AuthenticatedUser, @Param('inviteId') inviteId: string) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.organizations.revokeInvite(user.id, inviteId);
  }

  @Post('invites/:token/accept')
  async acceptInvite(@CurrentUser() authUser: AuthenticatedUser, @Param('token') token: string) {
    const user = await this.usersService.findOrCreateBySubject(authUser);
    return this.organizations.acceptInvite(user.id, user.email, token);
  }
}
