import type { PromDefinition } from './prom-definitions.js';

/**
 * KOOS-style scoring: each item is 0 (extreme problems) to 4 (no problems). Real KOOS computes
 * five separate 0-100 subscale scores; this placeholder collapses to a single 0-100 score (100 =
 * best) by normalizing the mean item response, since our placeholder has only one item per
 * subscale. Replace with the real per-subscale KOOS scoring once the licensed instrument is in.
 */
export function scoreKoos(answers: number[]): number {
  const mean = answers.reduce((a, b) => a + b, 0) / answers.length;
  return Math.round((mean / 4) * 100);
}

/**
 * Standard DASH/QuickDASH disability-score transformation (public scoring methodology, not owned
 * item content): ((mean of n responses) - 1) * 25, each response 1-5. Result range 0 (no
 * disability) to 100 (most severe disability) — note this is the OPPOSITE direction from the KOOS
 * score above (higher DASH = worse), matching the real instrument's convention.
 */
export function scoreQuickDash(answers: number[]): number {
  const mean = answers.reduce((a, b) => a + b, 0) / answers.length;
  return Math.round((mean - 1) * 25);
}

export function scoreForDefinition(definition: PromDefinition, answersById: Record<string, number>): number {
  const answers = definition.questions.map((q) => answersById[q.id]);
  if (answers.some((a) => typeof a !== 'number')) {
    throw new Error('Missing answer for one or more questions');
  }
  return definition.type === 'KOOS' ? scoreKoos(answers) : scoreQuickDash(answers);
}
