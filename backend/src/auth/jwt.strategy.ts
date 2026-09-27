import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwksRsa from 'jwks-rsa';

export interface AuthenticatedUser {
  sub: string;
  email: string;
}

/**
 * Validates Auth0-issued access tokens (RS256, verified against the tenant's JWKS endpoint).
 * Requires AUTH0_DOMAIN and AUTH0_AUDIENCE to be set to a real tenant/API identifier — see
 * PROGRESS.md for the current placeholder values and the dev-mode bypass used until a real
 * tenant is provisioned.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const domain = config.get<string>('AUTH0_DOMAIN');
    const audience = config.get<string>('AUTH0_AUDIENCE');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
      }),
      audience,
      issuer: `https://${domain}/`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: { sub: string; email?: string }): AuthenticatedUser {
    return { sub: payload.sub, email: payload.email ?? '' };
  }
}
