/**
 * Owns: Analysis.totals — headline savings range with the no-double-count rule
 * (types.ts DECISION(no-double-count)) and the recurring-spend sum.
 */
import type { KeyedFinding } from './rules/context';
import type { Analysis, RecurringCharge } from './types';

export function computeTotals(recurring: RecurringCharge[], keyed: KeyedFinding[]): Analysis['totals'] {
  // Per merchant, keep the LARGEST low and the LARGEST high across findings that touch it, then
  // sum merchants. Netflix flagged by both paying_twice and overlap therefore counts once.
  // price_step (merchantId null) claims no savings and is excluded.
  const lows = new Map<string, number>();
  const highs = new Map<string, number>();
  for (const { finding, merchantId } of keyed) {
    if (merchantId === null) continue;
    lows.set(merchantId, Math.max(lows.get(merchantId) ?? 0, finding.annualSavings.low));
    highs.set(merchantId, Math.max(highs.get(merchantId) ?? 0, finding.annualSavings.high));
  }
  const sum = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);
  return {
    annualLow: sum(lows),
    annualHigh: sum(highs),
    recurringAnnual: Math.round(recurring.reduce((total, r) => total + r.annualCost, 0)),
  };
}
