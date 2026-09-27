import { ConfigService } from '@nestjs/config';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';

function makeConfig(values: Record<string, string>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

function makeContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard dev bypass', () => {
  it('refuses to construct when the bypass is enabled alongside NODE_ENV=production', () => {
    expect(
      () => new JwtAuthGuard(makeConfig({ AUTH_DEV_BYPASS: 'true', NODE_ENV: 'production' })),
    ).toThrow(/production/);
  });

  it('allows the request through when dev headers are present and bypass is on', () => {
    const guard = new JwtAuthGuard(makeConfig({ AUTH_DEV_BYPASS: 'true', NODE_ENV: 'development' }));
    const ctx = makeContext({ 'x-dev-user-sub': 'sub-1', 'x-dev-user-email': 'a@example.com' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects the request when dev headers are missing, even with bypass on', () => {
    const guard = new JwtAuthGuard(makeConfig({ AUTH_DEV_BYPASS: 'true', NODE_ENV: 'development' }));
    const ctx = makeContext({});
    expect(guard.canActivate(ctx)).toBe(false);
  });
});
