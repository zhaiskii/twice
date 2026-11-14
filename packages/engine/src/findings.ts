/**
 * Owns: running the four finding rules over the recurring series and ordering the
 * result (SPEC step 3). The rules themselves live in src/rules/ — one file per kind.
 */
import { overlapFindings } from './rules/overlap';
import { payingTwiceFindings } from './rules/paying-twice';
import { phoneSwitchFindings } from './rules/phone-switch';
import { priceStepFindings } from './rules/price-step';
import type { KeyedFinding, RuleContext } from './rules/context';
import type { Catalog, Finding, Profile, RecurringCharge } from './types';

export function buildFindings(recurring: RecurringCharge[], profile: Profile, catalog: Catalog): KeyedFinding[] {
  const ctx: RuleContext = {
    recurring,
    byMerchant: new Map(recurring.map((r) => [r.merchantId, r])),
    profile,
    catalog,
  };
  return [...payingTwiceFindings(ctx), ...overlapFindings(ctx), ...phoneSwitchFindings(ctx), ...priceStepFindings(ctx)];
}

/** types.ts: sorted by annualSavings.high desc, price_step findings last (by increase). */
export function sortFindings(findings: Finding[]): Finding[] {
  const isStep = (f: Finding) => f.kind === 'price_step';
  return [...findings].sort(
    (a, b) =>
      Number(isStep(a)) - Number(isStep(b)) ||
      b.annualSavings.high - a.annualSavings.high ||
      (b.annualIncrease ?? 0) - (a.annualIncrease ?? 0) ||
      (a.id < b.id ? -1 : 1),
  );
}
