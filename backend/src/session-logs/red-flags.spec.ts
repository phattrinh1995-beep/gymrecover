import { isAnyRedFlagPresent, type RedFlagSymptoms } from './red-flags.js';

const clear: RedFlagSymptoms = {
  severeOrWorseningPain: false,
  newOrIncreasingSwelling: false,
  fever: false,
  numbnessOrTingling: false,
  calfPainOrSwelling: false,
  chestPainOrShortnessOfBreath: false,
};

describe('isAnyRedFlagPresent', () => {
  it('is false when no symptoms are checked', () => {
    expect(isAnyRedFlagPresent(clear)).toBe(false);
  });

  it.each(Object.keys(clear) as (keyof RedFlagSymptoms)[])('is true when only "%s" is checked', (key) => {
    expect(isAnyRedFlagPresent({ ...clear, [key]: true })).toBe(true);
  });

  it('is true when multiple symptoms are checked', () => {
    expect(isAnyRedFlagPresent({ ...clear, fever: true, chestPainOrShortnessOfBreath: true })).toBe(true);
  });
});
