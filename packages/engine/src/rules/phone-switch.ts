/**
 * Owns: finding kind `phone_switch` — a big-three carrier bill where the SAME network costs
 * much less on an MVNO/prepaid plan (SPEC step 3).
 */
import { money, recentIds } from '../text';
import type { CarrierRow, Finding, PlanRow, RecurringCharge } from '../types';
import type { KeyedFinding, RuleContext } from './context';

// DECISION(lines-estimate): when the user has not told us their line count we guess from the bill:
// ~$85 per line is a typical big-three postpaid price, clamped to 1–5 lines. The guess is always
// flagged (confidence 'medium' + assumption) and the quiz asks for the real number.
const TYPICAL_PER_LINE = 85;
const MAX_ESTIMATED_LINES = 5;
const ALTERNATIVES_SHOWN = 3;

const round2 = (n: number) => Math.round(n * 100) / 100;

function planTotal(plan: PlanRow, lines: number): number {
  return round2(plan.monthlyTotalByLines?.[String(lines)] ?? plan.monthlyPerLine * lines);
}

/** "Visible Visible" → "Visible": plan names often repeat the brand. */
function planLabel(plan: PlanRow): string {
  return plan.name.toLowerCase().startsWith(plan.brand.toLowerCase()) ? plan.name : `${plan.brand} ${plan.name}`;
}

function estimateLines(monthly: number): number {
  return Math.min(MAX_ESTIMATED_LINES, Math.max(1, Math.round(monthly / TYPICAL_PER_LINE)));
}

function buildKit(carrier: CarrierRow, best: PlanRow): Finding['kit'] {
  return [
    ...carrier.portOut.map((step) => ({ ...step })),
    {
      title: `Order the eSIM or SIM for ${planLabel(best)}`,
      body: `Sign up at ${best.url}. Choose "keep my number" and enter the transfer PIN and account number from the steps above.`,
    },
    {
      title: `Keep your ${carrier.name} line until the number ports`,
      body: `Do not cancel ${carrier.name} yet. Wait until the number has finished moving and calls and texts work on the new plan; cancelling early can lose your number.`,
    },
  ];
}

function phoneSwitchFor(series: RecurringCharge, carrier: CarrierRow, ctx: RuleContext): KeyedFinding | null {
  const monthly = series.currentAmount;
  const told = ctx.profile.phoneLines;
  const lines = told ?? estimateLines(monthly);

  // DECISION(cheaper-only): never recommend a plan that costs MORE than today's bill. That also
  // keeps `low` (saving vs the 3rd-cheapest shown) from going negative.
  const alternatives = ctx.catalog.plans
    .filter((p) => p.network === carrier.network)
    .map((plan) => ({ plan, total: planTotal(plan, lines) }))
    .filter((a) => a.total < monthly)
    .sort((a, b) => a.total - b.total || (a.plan.id < b.plan.id ? -1 : 1))
    .slice(0, ALTERNATIVES_SHOWN);
  const best = alternatives[0];
  const worst = alternatives[alternatives.length - 1];
  if (!best || !worst) return null;

  const high = Math.round((monthly - best.total) * 12);
  const low = Math.round((monthly - worst.total) * 12);
  if (high <= 0) return null;

  const assumptions = ['Assumes your phone is paid off. If you still owe installments, check the balance before switching.'];
  if (told === undefined) assumptions.unshift(`We estimated ${lines} line${lines === 1 ? '' : 's'} from your bill (about ${money(TYPICAL_PER_LINE)} per line). Tell us the real number to tighten this.`);
  if (alternatives.some((a) => !a.plan.taxesIncluded)) assumptions.push('Some plan prices are listed before taxes and fees, while your bill includes them.');
  assumptions.push(...carrier.warnings);

  return {
    merchantId: series.merchantId,
    finding: {
      id: `phone_switch:${carrier.id}`,
      kind: 'phone_switch',
      title: `Same ${carrier.name} network, ${money(best.total)}/mo instead of ${money(monthly)}`,
      detail: `Your ${carrier.name} bill is ${money(monthly)}/mo for ${lines} line${lines === 1 ? '' : 's'}. ${best.plan.brand} runs on the same network from ${money(best.total)}/mo.`,
      annualSavings: { low: Math.max(0, low), high },
      evidence: recentIds(series),
      rule: `${best.plan.brand} and similar plans use the ${carrier.name} network and cost less than your current bill.`,
      sources: [
        { label: `${carrier.name}: how to transfer your number out`, url: carrier.url, checkedOn: carrier.checkedOn },
        ...alternatives.map((a) => ({ label: `${planLabel(a.plan)} pricing`, url: a.plan.url, checkedOn: a.plan.checkedOn })),
      ],
      kit: buildKit(carrier, best.plan),
      confidence: told === undefined ? 'medium' : 'high',
      assumptions,
      alternatives: alternatives.map((a) => ({ planId: a.plan.id, brand: a.plan.brand, name: a.plan.name, monthlyTotal: a.total, url: a.plan.url })),
    },
  };
}

export function phoneSwitchFindings(ctx: RuleContext): KeyedFinding[] {
  const out: KeyedFinding[] = [];
  for (const series of ctx.recurring) {
    if (series.cadence !== 'monthly') continue;
    const carrierId = ctx.catalog.merchants.find((m) => m.id === series.merchantId)?.carrierId;
    const carrier = carrierId ? ctx.catalog.carriers.find((c) => c.id === carrierId) : undefined;
    // DECISION(big-three): see CarrierRow.isBigThree — someone already on an MVNO gets nothing.
    if (!carrier?.isBigThree) continue;
    const found = phoneSwitchFor(series, carrier, ctx);
    if (found) out.push(found);
  }
  return out;
}
