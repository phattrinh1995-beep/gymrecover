import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateOrganizationDto } from './dto/create-organization.dto.js';
import type { CreateInviteDto } from './dto/create-invite.dto.js';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Creates an org, a stub TRIAL subscription (build order item 10 — "do not integrate real
   * payment processing until explicitly asked"), and promotes the creator to ORG_ADMIN. */
  async createOrganization(userId: string, dto: CreateOrganizationDto) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (existing?.organizationId) {
      throw new ConflictException('You already belong to an organization');
    }

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        type: dto.type,
        subscription: { create: {} }, // schema defaults: plan TRIAL, status TRIALING, 1 seat
      },
      include: { subscription: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: org.id, role: 'ORG_ADMIN' },
    });

    return org;
  }

  async getMyOrganization(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.organizationId) return null;

    const org = await this.prisma.organization.findUnique({
      where: { id: user.organizationId },
      include: {
        subscription: true,
        users: { select: { id: true, email: true, role: true } },
      },
    });
    if (!org) return null;

    // Only an org admin sees pending invites — everyone else just sees the roster/subscription.
    const invites =
      user.role === 'ORG_ADMIN'
        ? await this.prisma.orgInvite.findMany({ where: { organizationId: org.id }, orderBy: { createdAt: 'desc' } })
        : [];

    return { ...org, invites };
  }

  private async assertOrgAdmin(userId: string, organizationId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.organizationId !== organizationId || user.role !== 'ORG_ADMIN') {
      throw new ForbiddenException('You are not an admin of this organization');
    }
  }

  /** No real email delivery is configured (Postmark isn't set up — the same gap noted for push
   * notifications in milestone 4 and provider alerts in milestone 8). The invite token is
   * returned directly to the admin to share manually, rather than silently claiming an email was
   * sent when none was. */
  async createInvite(userId: string, organizationId: string, dto: CreateInviteDto) {
    await this.assertOrgAdmin(userId, organizationId);

    const token = randomBytes(16).toString('hex');
    const invite = await this.prisma.orgInvite.create({
      data: {
        organizationId,
        email: dto.email.toLowerCase(),
        role: dto.role,
        token,
        invitedByUserId: userId,
      },
    });

    this.logger.warn(
      `Invite created for ${invite.email} (role ${invite.role}) to org ${organizationId}. No email service is configured — share this token manually: ${token}`,
    );

    return invite;
  }

  async revokeInvite(userId: string, inviteId: string) {
    const invite = await this.prisma.orgInvite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new NotFoundException('Invite not found');
    await this.assertOrgAdmin(userId, invite.organizationId);
    return this.prisma.orgInvite.update({ where: { id: inviteId }, data: { status: 'REVOKED' } });
  }

  async acceptInvite(userId: string, userEmail: string, token: string) {
    const invite = await this.prisma.orgInvite.findUnique({ where: { token } });
    if (!invite || invite.status !== 'PENDING') {
      throw new NotFoundException('Invite not found or already used');
    }
    if (invite.email !== userEmail.toLowerCase()) {
      throw new ForbiddenException('This invite was issued to a different email address');
    }

    const [, updatedUser] = await this.prisma.$transaction([
      this.prisma.orgInvite.update({ where: { id: invite.id }, data: { status: 'ACCEPTED', acceptedAt: new Date() } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { organizationId: invite.organizationId, role: invite.role === 'PROVIDER' ? 'PROVIDER' : 'MEMBER' },
      }),
    ]);

    return updatedUser;
  }
}
