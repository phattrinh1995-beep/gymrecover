/**
 * The Adaptive Program Engine's rule evaluation core — the highest-risk-of-bug component per the
 * project brief, kept deliberately pure (no DB access) so every criteria type is directly
 * unit-testable. This is NOT a black-box model: every phase's exit_criteria is an explicit,
 * inspectable JSON rule set (see prisma/schema.prisma's Phase.exitCriteria), and this module is
 * the one place those rules are interpreted.
 */

/** Pre-computed facts the evaluators run against. Computed by ProgramEngineService from real
 * SessionLog/InjuryProfile data — kept as a flat plain object so tests never need a database. */
export interface CriteriaFacts {
  /** Days since surgery, or null if this injury profile has no surgery on file (criterion is
   * then treated as not applicable). */
  daysSinceSurgery: number | null;
  /** Most recent logged pain scores for this program instance, most recent first, already
   * limited to a small recent window by the caller (e.g. last 3). Empty if none logged yet. */
  recentPainScores: number[];
  /** True if any session/red-flag check in the last 24h reported new or increasing swelling. */
  swellingReportedInLast24h: boolean;
}

export interface CriterionResult {
  key: string;
  met: boolean;
  reason: string;
}

type Evaluator = (value: unknown, facts: CriteriaFacts) => CriterionResult;

function asNumber(key: string, value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

const evaluators: Record<string, Evaluator> = {
  min_days_since_surgery: (value, facts) => {
    const threshold = asNumber('min_days_since_surgery', value);
    if (threshold === null) {
      return { key: 'min_days_since_surgery', met: false, reason: 'Invalid threshold configured for this criterion.' };
    }
    if (facts.daysSinceSurgery === null) {
      return {
        key: 'min_days_since_surgery',
        met: true,
        reason: 'No surgery date on file for this injury; criterion does not apply.',
      };
    }
    const met = facts.daysSinceSurgery >= threshold;
    return {
      key: 'min_days_since_surgery',
      met,
      reason: met
        ? `${facts.daysSinceSurgery} days since surgery, meets the ${threshold}-day minimum.`
        : `Only ${facts.daysSinceSurgery} of ${threshold} required days since surgery have passed.`,
    };
  },

  max_pain_score: (value, facts) => {
    const threshold = asNumber('max_pain_score', value);
    if (threshold === null) {
      return { key: 'max_pain_score', met: false, reason: 'Invalid threshold configured for this criterion.' };
    }
    if (facts.recentPainScores.length === 0) {
      return { key: 'max_pain_score', met: false, reason: 'No pain score has been logged yet.' };
    }
    const worst = Math.max(...facts.recentPainScores);
    const met = worst <= threshold;
    return {
      key: 'max_pain_score',
      met,
      reason: met
        ? `Recent pain scores (${facts.recentPainScores.join(', ')}) are all at or below ${threshold}.`
        : `Recent pain score of ${worst} exceeds the maximum of ${threshold}.`,
    };
  },

  no_swelling_increase_24h: (value, facts) => {
    if (value !== true) {
      return { key: 'no_swelling_increase_24h', met: true, reason: 'Criterion not required for this phase.' };
    }
    const met = !facts.swellingReportedInLast24h;
    return {
      key: 'no_swelling_increase_24h',
      met,
      reason: met
        ? 'No new or increasing swelling reported in the last 24 hours.'
        : 'New or increasing swelling was reported within the last 24 hours.',
    };
  },

  // A phase author's explicit "this always needs a human" flag (e.g. return-to-sport clearance).
  // Automated advancement can never satisfy this — it is only ever cleared by a provider
  // acknowledgment (build order item 8), regardless of every other criterion passing.
  provider_hold: (value) => {
    if (value === true) {
      return {
        key: 'provider_hold',
        met: false,
        reason: 'This phase requires explicit provider sign-off before advancing, regardless of other criteria.',
      };
    }
    return { key: 'provider_hold', met: true, reason: 'No provider sign-off required by this phase.' };
  },
};

export interface PhaseEligibility {
  eligible: boolean;
  results: CriterionResult[];
}

/** Evaluates a phase's exitCriteria JSON against the given facts. Any criterion key with no
 * registered evaluator above is reported as NOT met, with an explicit reason — this engine never
 * silently ignores a rule it doesn't know how to check, and never fabricates a measurement it
 * doesn't have real data for (e.g. range-of-motion degrees, symmetry indices — not yet collected
 * anywhere in the app, so those criteria correctly block automated advancement until a real data
 * source is built and wired in here). */
export function evaluatePhaseExitCriteria(
  exitCriteria: Record<string, unknown>,
  facts: CriteriaFacts,
): PhaseEligibility {
  const results: CriterionResult[] = Object.entries(exitCriteria).map(([key, value]) => {
    const evaluator = evaluators[key];
    if (!evaluator) {
      return {
        key,
        met: false,
        reason: `No automated evaluator implemented for "${key}" yet — this criterion requires clinical data collection that doesn't exist in the app, so it blocks automated advancement until a provider reviews it manually.`,
      };
    }
    return evaluator(value, facts);
  });

  return { eligible: results.every((r) => r.met), results };
}
