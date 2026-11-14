/**
 * Formatting for money, ranges, dates and bank formats. Pure functions only.
 * Every number the UI shows goes through here so the voice stays consistent.
 */
import type { BankFormat } from '@twice/engine';

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Whole dollars: "$1,240". Used for annual figures — cents there are false precision. */
export function money(n: number): string {
  return usd0.format(Math.round(n));
}

/** Dollars and cents: "$15.49". Used for statement rows and monthly plan prices. */
export function cents(n: number): string {
  return usd2.format(n);
}

/** Signed statement amount. Engine convention: positive = charge, negative = refund/payment. */
export function signedCents(n: number): string {
  return n < 0 ? `−${usd2.format(Math.abs(n))}` : usd2.format(n);
}

// DECISION(ranges): savings show as a range whenever low ≠ high (SPEC: never
// overstate). En dash, no spaces, both ends formatted — "$480–$1,320".
export function moneyRange(r: { low: number; high: number }): string {
  return Math.round(r.low) === Math.round(r.high) ? money(r.high) : `${money(r.low)}–${money(r.high)}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "2026-10-03" → "Oct 3, 2026". Parsed by hand: `new Date('2026-10-03')` is UTC
 * midnight and renders as Oct 2 in every US timezone.
 */
export function formatDate(iso: string, opts: { year?: boolean } = {}): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const month = MONTHS[Number(m[2]) - 1] ?? m[2];
  const day = Number(m[3]);
  return opts.year === false ? `${month} ${day}` : `${month} ${day}, ${m[1]}`;
}

/** "2026-10" style month label: "Oct 2026". */
export function formatMonth(iso: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

// AGENT: if BankFormat in packages/engine/src/types.ts gains a member, add its label here
// (the Record type makes the compiler remind you).
export const FORMAT_LABEL: Record<BankFormat, string> = {
  chase_card: 'Chase card',
  chase_checking: 'Chase checking',
  amex: 'American Express',
  bofa_checking: 'Bank of America checking',
  bofa_card: 'Bank of America card',
  capital_one: 'Capital One',
  discover: 'Discover',
  generic: 'Generic CSV',
};

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
}

/** Host name for a source link label fallback: "https://www.t-mobile.com/x" → "t-mobile.com". */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
