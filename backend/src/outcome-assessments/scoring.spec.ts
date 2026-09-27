import { scoreKoos, scoreQuickDash, scoreForDefinition } from './scoring.js';
import { KOOS_DEFINITION, QUICKDASH_DEFINITION } from './prom-definitions.js';

describe('scoreKoos', () => {
  it('scores 100 (best) when every item is the best response', () => {
    expect(scoreKoos([4, 4, 4, 4, 4])).toBe(100);
  });

  it('scores 0 (worst) when every item is the worst response', () => {
    expect(scoreKoos([0, 0, 0, 0, 0])).toBe(0);
  });

  it('scores 50 for a middling response', () => {
    expect(scoreKoos([2, 2, 2, 2, 2])).toBe(50);
  });
});

describe('scoreQuickDash', () => {
  it('scores 0 (no disability) when every item is the best response', () => {
    expect(scoreQuickDash(Array(11).fill(1))).toBe(0);
  });

  it('scores 100 (most severe) when every item is the worst response', () => {
    expect(scoreQuickDash(Array(11).fill(5))).toBe(100);
  });

  it('scores 50 for a middling response', () => {
    expect(scoreQuickDash(Array(11).fill(3))).toBe(50);
  });
});

describe('scoreForDefinition', () => {
  it('computes a KOOS score from answers keyed by question id', () => {
    const answers = Object.fromEntries(KOOS_DEFINITION.questions.map((q) => [q.id, 4]));
    expect(scoreForDefinition(KOOS_DEFINITION, answers)).toBe(100);
  });

  it('computes a QuickDASH score from answers keyed by question id', () => {
    const answers = Object.fromEntries(QUICKDASH_DEFINITION.questions.map((q) => [q.id, 1]));
    expect(scoreForDefinition(QUICKDASH_DEFINITION, answers)).toBe(0);
  });

  it('throws if an answer is missing', () => {
    const answers = Object.fromEntries(KOOS_DEFINITION.questions.slice(1).map((q) => [q.id, 4]));
    expect(() => scoreForDefinition(KOOS_DEFINITION, answers)).toThrow('Missing answer');
  });
});
