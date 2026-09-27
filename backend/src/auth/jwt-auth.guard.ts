import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from './jwt.strategy.js';

/**
 * DEV-ONLY AUTH BYPASS
 * ====================
 * No real Auth0 tenant has been provisioned for this project yet (AUTH0_DOMAIN/AUTH0_AUDIENCE
 * in .env are placeholders), so the real JWKS-verified JwtStrategy can't be exercised end to end
 * locally. When AUTH_DEV_BYPASS=true, this guard trusts two request headers instead of verifying
 * a signed token:
 *   x-dev-user-sub    — stands in for the Auth0 `sub` claim
 *   x-dev-user-email  — stands in for the `email` claim
 *
 * This is hard-disabled outside development: the guard throws at construction time if the
 * bypass flag is set while NODE_ENV=production, so it cannot silently ship enabled. Once a real
 * Auth0 tenant is wired up, delete this class and use JwtAuthGuard = AuthGuard('jwt') directly.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly devBypass: boolean;
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly config: ConfigService) {
    super();
    this.devBypass = this.config.get<string>('AUTH_DEV_BYPASS') === 'true';
    if (this.devBypass && this.config.get<string>('NODE_ENV') === 'production') {
      throw new Error('AUTH_DEV_BYPASS must never be enabled when NODE_ENV=production');
    }
    if (this.devBypass) {
      this.logger.warn(
        'AUTH_DEV_BYPASS is enabled — requests are trusted via x-dev-user-sub/x-dev-user-email headers instead of verified Auth0 tokens. This must be off before any real deployment.',
      );
    }
  }

  override canActivate(context: ExecutionContext) {
    if (this.devBypass) {
      const request = context.switchToHttp().getRequest();
      const sub = request.headers['x-dev-user-sub'];
      const email = request.headers['x-dev-user-email'];
      if (typeof sub === 'string' && typeof email === 'string' && sub && email) {
        const user: AuthenticatedUser = { sub, email };
        request.user = user;
        return true;
      }
      return false;
    }
    return super.canActivate(context);
  }
}
