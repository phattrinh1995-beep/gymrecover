/**
 * Whether a pending phase advancement should actually be applied (i.e. currentPhaseId moves
 * forward). Kept pure and separate from criteria evaluation because this is the other
 * safety-critical rule in the engine: advancement is NEVER automatic just because criteria pass —
 * it always requires the patient's own acknowledgment, plus the assigned provider's if one exists
 * (build order item 5: "not an automatic silent change").
 */
export interface AdvancementGateInput {
  hasPendingPhase: boolean;
  userAcknowledged: boolean;
  providerRequired: boolean;
  providerAcknowledged: boolean;
  manualHold: boolean;
}

export function shouldApplyAdvancement(input: AdvancementGateInput): boolean {
  if (input.manualHold) return false;
  if (!input.hasPendingPhase) return false;
  if (!input.userAcknowledged) return false;
  if (input.providerRequired && !input.providerAcknowledged) return false;
  return true;
}
