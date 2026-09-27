import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';

/**
 * Non-functional requirement: "All rehab content must be editable via a simple internal admin
 * CMS... do not hardcode exercises/phases in application code." This guard restricts every CMS
 * endpoint to SUPER_ADMIN, checked against the real User row (never trusted from the token/client)
 * — the same pattern as ProviderPortalService's assertAssigned and OrganizationsService's
 * assertOrgAdmin.
 */
@Injectable()
export class AdminCmsGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authUser = request.user as AuthenticatedUser | undefined;
    if (!authUser) return false;

    const user = await this.prisma.user.findUnique({ where: { authSubjectId: authUser.sub } });
    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('SUPER_ADMIN role required for the admin CMS');
    }
    return true;
  }
}
