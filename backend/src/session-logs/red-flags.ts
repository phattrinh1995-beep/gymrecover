export interface RedFlagSymptoms {
  severeOrWorseningPain: boolean;
  newOrIncreasingSwelling: boolean;
  fever: boolean;
  numbnessOrTingling: boolean;
  calfPainOrSwelling: boolean;
  chestPainOrShortnessOfBreath: boolean;
}

/** True if ANY red-flag symptom is present. There is deliberately no threshold, weighting, or
 * "minor vs. severe" judgment call here — a single checked box blocks the session, full stop
 * (build order item 4: "no dismiss-and-continue path"). */
export function isAnyRedFlagPresent(symptoms: RedFlagSymptoms): boolean {
  return Object.values(symptoms).some(Boolean);
}
