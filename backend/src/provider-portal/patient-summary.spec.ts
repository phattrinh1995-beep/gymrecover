import { countCompletedSessionsSince, recentPainTrend, type SessionLogLike } from './patient-summary.js';

const day = (n: number) => new Date(Date.UTC(2026, 0, n));

describe('countCompletedSessionsSince', () => {
  const logs: SessionLogLike[] = [
    { completed: true, createdAt: day(10), painScore: 2, rpe: 4 },
    { completed: false, createdAt: day(10), painScore: null, rpe: null },
    { completed: true, createdAt: day(1), painScore: 1, rpe: 3 },
  ];

  it('counts only completed sessions on/after the cutoff', () => {
    expect(countCompletedSessionsSince(logs, day(5))).toBe(1);
  });

  it('counts all completed sessions when the cutoff predates everything', () => {
    expect(countCompletedSessionsSince(logs, day(0))).toBe(2);
  });

  it('excludes uncompleted (e.g. red-flag-blocked) sessions', () => {
    expect(countCompletedSessionsSince(logs, day(10))).toBe(1);
  });
});

describe('recentPainTrend', () => {
  it('returns pain scores most-recent-first, skipping nulls', () => {
    const logs: SessionLogLike[] = [
      { completed: true, createdAt: day(1), painScore: 5, rpe: null },
      { completed: false, createdAt: day(2), painScore: null, rpe: null },
      { completed: true, createdAt: day(3), painScore: 2, rpe: null },
    ];
    expect(recentPainTrend(logs)).toEqual([2, 5]);
  });

  it('respects the limit', () => {
    const logs: SessionLogLike[] = Array.from({ length: 5 }, (_, i) => ({
      completed: true,
      createdAt: day(i + 1),
      painScore: i,
      rpe: null,
    }));
    expect(recentPainTrend(logs, 2)).toEqual([4, 3]);
  });
});
