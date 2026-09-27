import { evaluatePhaseExitCriteria, type CriteriaFacts } from './criteria.js';

const baseFacts: CriteriaFacts = {
  daysSinceSurgery: null,
  recentPainScores: [],
  swellingReportedInLast24h: false,
};

describe('min_days_since_surgery', () => {
  it('is met when enough days have passed', () => {
    const result = evaluatePhaseExitCriteria(
      { min_days_since_surgery: 14 },
      { ...baseFacts, daysSinceSurgery: 20 },
    );
    expect(result.eligible).toBe(true);
  });

  it('is not met when too few days have passed', () => {
    const result = evaluatePhaseExitCriteria(
      { min_days_since_surgery: 14 },
      { ...baseFacts, daysSinceSurgery: 5 },
    );
    expect(result.eligible).toBe(false);
    expect(result.results[0].reason).toMatch(/5 of 14/);
  });

  it('is exactly met at the boundary', () => {
    const result = evaluatePhaseExitCriteria(
      { min_days_since_surgery: 14 },
      { ...baseFacts, daysSinceSurgery: 14 },
    );
    expect(result.eligible).toBe(true);
  });

  it('is treated as not applicable when there is no surgery date', () => {
    const result = evaluatePhaseExitCriteria({ min_days_since_surgery: 14 }, baseFacts);
    expect(result.eligible).toBe(true);
  });
});

describe('max_pain_score', () => {
  it('is met when all recent pain scores are at or below the threshold', () => {
    const result = evaluatePhaseExitCriteria(
      { max_pain_score: 3 },
      { ...baseFacts, recentPainScores: [1, 2, 3] },
    );
    expect(result.eligible).toBe(true);
  });

  it('is not met when any recent pain score exceeds the threshold', () => {
    const result = evaluatePhaseExitCriteria(
      { max_pain_score: 3 },
      { ...baseFacts, recentPainScores: [1, 5, 2] },
    );
    expect(result.eligible).toBe(false);
    expect(result.results[0].reason).toMatch(/exceeds/);
  });

  it('is not met when no pain score has been logged (insufficient data, not assumed pass)', () => {
    const result = evaluatePhaseExitCriteria({ max_pain_score: 3 }, baseFacts);
    expect(result.eligible).toBe(false);
    expect(result.results[0].reason).toMatch(/No pain score/);
  });
});

describe('no_swelling_increase_24h', () => {
  it('is met when the criterion is not required', () => {
    const result = evaluatePhaseExitCriteria({ no_swelling_increase_24h: false }, baseFacts);
    expect(result.eligible).toBe(true);
  });

  it('is met when required and no swelling was reported', () => {
    const result = evaluatePhaseExitCriteria(
      { no_swelling_increase_24h: true },
      { ...baseFacts, swellingReportedInLast24h: false },
    );
    expect(result.eligible).toBe(true);
  });

  it('is not met when required and swelling was reported in the last 24h', () => {
    const result = evaluatePhaseExitCriteria(
      { no_swelling_increase_24h: true },
      { ...baseFacts, swellingReportedInLast24h: true },
    );
    expect(result.eligible).toBe(false);
  });
});

describe('provider_hold', () => {
  it('always blocks when true, even if nothing else is required', () => {
    const result = evaluatePhaseExitCriteria({ provider_hold: true }, baseFacts);
    expect(result.eligible).toBe(false);
  });

  it('blocks even when every other criterion in the same phase passes', () => {
    const result = evaluatePhaseExitCriteria(
      { min_days_since_surgery: 1, provider_hold: true },
      { ...baseFacts, daysSinceSurgery: 999 },
    );
    expect(result.eligible).toBe(false);
    expect(result.results.find((r) => r.key === 'provider_hold')?.met).toBe(false);
  });

  it('does not block when false', () => {
    const result = evaluatePhaseExitCriteria({ provider_hold: false }, baseFacts);
    expect(result.eligible).toBe(true);
  });
});

describe('unrecognized criteria', () => {
  it('is never silently treated as met', () => {
    const result = evaluatePhaseExitCriteria({ min_knee_flexion_rom_degrees: 120 }, baseFacts);
    expect(result.eligible).toBe(false);
    expect(result.results[0].reason).toMatch(/No automated evaluator/);
  });
});

describe('combined phase (mirrors the seeded ACL phase 1 exit criteria)', () => {
  const exitCriteria = {
    min_days_since_surgery: 14,
    max_pain_score: 4,
    no_swelling_increase_24h: true,
    provider_hold: false,
  };

  it('is eligible when every criterion passes', () => {
    const facts: CriteriaFacts = {
      daysSinceSurgery: 15,
      recentPainScores: [2, 3],
      swellingReportedInLast24h: false,
    };
    expect(evaluatePhaseExitCriteria(exitCriteria, facts).eligible).toBe(true);
  });

  it('is not eligible when just one criterion fails', () => {
    const facts: CriteriaFacts = {
      daysSinceSurgery: 15,
      recentPainScores: [2, 3],
      swellingReportedInLast24h: true,
    };
    expect(evaluatePhaseExitCriteria(exitCriteria, facts).eligible).toBe(false);
  });
});
