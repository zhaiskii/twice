import { describe, expect, it } from 'vitest';
import { parseAmount, parseDate } from './values';

describe('parseDate', () => {
  it.each([
    ['11/03/2025', '2025-11-03'],
    ['1/5/26', '2026-01-05'],
    ['2026-02-28', '2026-02-28'],
    ['2026-02-28T10:00:00Z', '2026-02-28'],
    ['2026/3/9', '2026-03-09'],
    [' "12/31/2025" ', '2025-12-31'],
  ])('%s → %s', (raw, iso) => expect(parseDate(raw)).toBe(iso));

  it.each(['', 'Pending', '13/01/2025', '02/30/2025', '2025-02-29', '11/2025', undefined])('rejects %s', (raw) =>
    expect(parseDate(raw)).toBeNull(),
  );

  it('accepts Feb 29 in a leap year', () => expect(parseDate('02/29/2028')).toBe('2028-02-29'));
});

describe('parseAmount', () => {
  it.each([
    ['$1,234.56', 1234.56],
    ['(12.00)', -12],
    ['-12.00', -12],
    ['12.00-', -12],
    ['−12.50', -12.5],
    ['  $0.99 ', 0.99],
    ['+5', 5],
    ['.5', 0.5],
    ['-$1,000', -1000],
  ])('%s → %s', (raw, value) => expect(parseAmount(raw)).toBe(value));

  it.each(['', '  ', 'abc', '$', '1.2.3', undefined])('rejects %s', (raw) => expect(parseAmount(raw)).toBeNull());
});
