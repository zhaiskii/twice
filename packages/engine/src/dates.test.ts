import { describe, expect, it } from 'vitest';
import { addDays, dayNumber, isoFromDayNumber, prettyDate } from './dates';

describe('dates', () => {
  it('uses the Unix epoch as day 0', () => expect(dayNumber('1970-01-01')).toBe(0));

  it('round-trips every day across leap and non-leap years', () => {
    for (let n = dayNumber('2023-12-25'); n <= dayNumber('2028-03-05'); n += 1) {
      expect(dayNumber(isoFromDayNumber(n))).toBe(n);
    }
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('returns NaN for malformed dates instead of throwing', () => {
    expect(dayNumber('')).toBeNaN();
    expect(dayNumber('11/03/2025')).toBeNaN();
    expect(dayNumber('2025-13-01')).toBeNaN();
  });

  it('prints plain-English dates', () => expect(prettyDate('2026-08-12')).toBe('Aug 12, 2026'));
});
