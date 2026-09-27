import { requiresClearanceConfirmation } from './users.service.js';

describe('requiresClearanceConfirmation', () => {
  it('is false when there are no injury profiles', () => {
    expect(requiresClearanceConfirmation([])).toBe(false);
  });

  it('is false for a non-surgical injury profile regardless of clearance status', () => {
    expect(requiresClearanceConfirmation([{ surgeryDate: null, clearanceStatus: 'PENDING' }])).toBe(false);
  });

  it('is true when a surgical injury profile has not been cleared', () => {
    expect(
      requiresClearanceConfirmation([{ surgeryDate: new Date('2026-01-01'), clearanceStatus: 'PENDING' }]),
    ).toBe(true);
  });

  it('is false once a surgical injury profile has been self-reported cleared', () => {
    expect(
      requiresClearanceConfirmation([{ surgeryDate: new Date('2026-01-01'), clearanceStatus: 'SELF_REPORTED' }]),
    ).toBe(false);
  });

  it('is false once provider-confirmed', () => {
    expect(
      requiresClearanceConfirmation([{ surgeryDate: new Date('2026-01-01'), clearanceStatus: 'PROVIDER_CONFIRMED' }]),
    ).toBe(false);
  });

  it('is true if any one of several injury profiles is uncleared', () => {
    expect(
      requiresClearanceConfirmation([
        { surgeryDate: new Date('2025-01-01'), clearanceStatus: 'PROVIDER_CONFIRMED' },
        { surgeryDate: new Date('2026-01-01'), clearanceStatus: 'PENDING' },
      ]),
    ).toBe(true);
  });
});
