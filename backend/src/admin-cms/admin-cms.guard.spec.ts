import { AdminCmsGuard } from './admin-cms.guard.js';
import type { ExecutionContext } from '@nestjs/common';

function makeContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function makeFakePrisma(user: { role: string } | null) {
  return { user: { findUnique: async () => user } };
}

describe('AdminCmsGuard', () => {
  it('rejects when there is no authenticated user on the request', async () => {
    const guard = new AdminCmsGuard(makeFakePrisma(null) as never);
    expect(await guard.canActivate(makeContext(undefined))).toBe(false);
  });

  it('rejects a non-SUPER_ADMIN user', async () => {
    const guard = new AdminCmsGuard(makeFakePrisma({ role: 'PROVIDER' }) as never);
    await expect(guard.canActivate(makeContext({ sub: 'x', email: 'a@b.com' }))).rejects.toThrow(
      'SUPER_ADMIN role required',
    );
  });

  it('rejects when the token subject has no matching User row', async () => {
    const guard = new AdminCmsGuard(makeFakePrisma(null) as never);
    await expect(guard.canActivate(makeContext({ sub: 'x', email: 'a@b.com' }))).rejects.toThrow(
      'SUPER_ADMIN role required',
    );
  });

  it('allows a real SUPER_ADMIN user', async () => {
    const guard = new AdminCmsGuard(makeFakePrisma({ role: 'SUPER_ADMIN' }) as never);
    expect(await guard.canActivate(makeContext({ sub: 'x', email: 'a@b.com' }))).toBe(true);
  });
});
