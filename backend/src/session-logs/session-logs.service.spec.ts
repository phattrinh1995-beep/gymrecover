import { SessionLogsService } from './session-logs.service.js';

function makeFakePrisma(sessionLog: Record<string, unknown> | null) {
  return {
    sessionLog: {
      findUnique: async () => sessionLog,
      update: async ({ data }: { data: unknown }) => ({ ...sessionLog, ...(data as object) }),
    },
  };
}

const dto = { painScore: 3, rpe: 5, exerciseResults: [] };

describe('SessionLogsService.completeSession', () => {
  it('rejects when the session log does not exist', async () => {
    const service = new SessionLogsService(makeFakePrisma(null) as never, {} as never);
    await expect(service.completeSession('user-1', 'missing-id', dto)).rejects.toThrow('Session log not found');
  });

  it('rejects when the session log belongs to a different user', async () => {
    const service = new SessionLogsService(
      makeFakePrisma({ id: 's1', userId: 'someone-else', redFlagTriggered: false }) as never,
      {} as never,
    );
    await expect(service.completeSession('user-1', 's1', dto)).rejects.toThrow('Not your session log');
  });

  it('rejects completing a session that the red-flag check blocked', async () => {
    const service = new SessionLogsService(
      makeFakePrisma({ id: 's1', userId: 'user-1', redFlagTriggered: true }) as never,
      {} as never,
    );
    await expect(service.completeSession('user-1', 's1', dto)).rejects.toThrow('blocked by the red-flag check');
  });

  it('completes a valid, unblocked session belonging to the caller', async () => {
    const service = new SessionLogsService(
      makeFakePrisma({ id: 's1', userId: 'user-1', redFlagTriggered: false }) as never,
      {} as never,
    );
    const result = await service.completeSession('user-1', 's1', dto);
    expect(result).toMatchObject({ completed: true, painScore: 3, rpe: 5 });
  });
});
