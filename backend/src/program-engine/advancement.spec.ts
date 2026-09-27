import { shouldApplyAdvancement, type AdvancementGateInput } from './advancement.js';

const base: AdvancementGateInput = {
  hasPendingPhase: true,
  userAcknowledged: true,
  providerRequired: false,
  providerAcknowledged: false,
  manualHold: false,
};

describe('shouldApplyAdvancement', () => {
  it('applies when there is no assigned provider and the patient has acknowledged', () => {
    expect(shouldApplyAdvancement(base)).toBe(true);
  });

  it('does not apply with no pending phase', () => {
    expect(shouldApplyAdvancement({ ...base, hasPendingPhase: false })).toBe(false);
  });

  it('does not apply until the patient acknowledges', () => {
    expect(shouldApplyAdvancement({ ...base, userAcknowledged: false })).toBe(false);
  });

  it('does not apply when a provider is required but has not acknowledged, even if the patient has', () => {
    expect(shouldApplyAdvancement({ ...base, providerRequired: true, providerAcknowledged: false })).toBe(false);
  });

  it('applies once both patient and required provider have acknowledged', () => {
    expect(shouldApplyAdvancement({ ...base, providerRequired: true, providerAcknowledged: true })).toBe(true);
  });

  it('never applies while a manual hold is in place, even with every acknowledgment in hand', () => {
    expect(
      shouldApplyAdvancement({ ...base, providerRequired: true, providerAcknowledged: true, manualHold: true }),
    ).toBe(false);
  });
});
