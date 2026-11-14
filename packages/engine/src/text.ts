/**
 * Owns: small plain-English formatting helpers shared by findings and needs
 * (dollar amounts, "/mo" suffixes, name lists, evidence slicing).
 */
import type { RecurringCharge } from './types';

/** $165 for whole dollars, $11.99 otherwise. */
export function money(n: number): string {
  const whole = Math.abs(n - Math.round(n)) < 0.005;
  return `$${whole ? Math.round(n).toLocaleString('en-US') : n.toFixed(2)}`;
}

const PERIOD_SUFFIX = { weekly: '/wk', monthly: '/mo', annual: '/yr' } as const;

/** "$11.99/mo" */
export function perPeriod(r: RecurringCharge): string {
  return `${money(r.currentAmount)}${PERIOD_SUFFIX[r.cadence]}`;
}

/** ["A"] → "A", ["A","B"] → "A and B", ["A","B","C"] → "A, B and C". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// DECISION(evidence-size): findings cite the most recent charges, not all twelve. The UI shows
// these as evidence rows and a wall of 24 near-identical lines proves nothing extra. The full
// series stays on `RecurringCharge.transactionIds` for anyone who wants it.
const EVIDENCE_PER_SERIES = 3;

export function recentIds(r: RecurringCharge): string[] {
  return r.transactionIds.slice(-EVIDENCE_PER_SERIES);
}
