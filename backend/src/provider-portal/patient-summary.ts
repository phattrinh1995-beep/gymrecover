/**
 * Pure helpers for summarizing a patient's session history for the provider portal. Deliberately
 * avoid inventing an "adherence %" against some assumed prescribed frequency — the data model has
 * no scheduled-session cadence to compare against, and fabricating one would be exactly the kind
 * of invented clinical judgment the project brief warns against. Instead these report plain,
 * honest counts/trends a provider can interpret themselves.
 */

export interface SessionLogLike {
  completed: boolean;
  createdAt: Date;
  painScore: number | null;
  rpe: number | null;
}

export function countCompletedSessionsSince(logs: SessionLogLike[], since: Date): number {
  return logs.filter((l) => l.completed && l.createdAt >= since).length;
}

/** Most recent pain scores, most recent first, skipping sessions with no pain score logged. */
export function recentPainTrend(logs: SessionLogLike[], limit = 10): number[] {
  return logs
    .filter((l) => l.painScore !== null)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
    .map((l) => l.painScore as number);
}
