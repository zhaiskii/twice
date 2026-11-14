/**
 * Owns: finding kind `overlap` — two or more services doing one job (SPEC step 3).
 */
import { addDays, prettyDate } from '../dates';
import { joinNames, money, perPeriod, recentIds } from '../text';
import type { MerchantCategory, RecurringCharge } from '../types';
import type { KeyedFinding, RuleContext } from './context';

interface OverlapCategory {
  /** Singular noun phrase for the rule text: "music streaming". */
  label: string;
  /** Services needed before we call it an overlap. */
  minServices: number;
}

// DECISION(overlap-categories): only categories where two paid services genuinely do one job.
// Video streaming needs 3: most households run two (a main one plus a sports/kids one) and flagging
// that would be noise. `membership`, `gym`, `wireless` are excluded on purpose (Costco + Prime are
// not substitutes; two wireless lines are different people). Revisit with user feedback.
const OVERLAP_CATEGORIES: Partial<Record<MerchantCategory, OverlapCategory>> = {
  music: { label: 'music', minServices: 2 },
  cloud_storage: { label: 'cloud storage', minServices: 2 },
  delivery: { label: 'delivery membership', minServices: 2 },
  streaming_video: { label: 'video streaming', minServices: 3 },
};

function groupByCategory(recurring: RecurringCharge[]): Map<MerchantCategory, RecurringCharge[]> {
  const groups = new Map<MerchantCategory, RecurringCharge[]>();
  for (const r of recurring) {
    if (!OVERLAP_CATEGORIES[r.category]) continue;
    groups.set(r.category, [...(groups.get(r.category) ?? []), r]);
  }
  return groups;
}

export function overlapFindings(ctx: RuleContext): KeyedFinding[] {
  const out: KeyedFinding[] = [];
  for (const [category, services] of groupByCategory(ctx.recurring)) {
    const spec = OVERLAP_CATEGORIES[category]!;
    if (services.length < spec.minServices) continue;

    // Cheapest first; id breaks ties so the result never depends on input order.
    const byCost = [...services].sort((a, b) => a.annualCost - b.annualCost || (a.merchantId < b.merchantId ? -1 : 1));
    const cheapest = byCost[0]!;
    // DECISION(overlap-savings): saving = the CHEAPEST service's annual cost, low = high. It is the
    // floor ("drop even the cheapest one"); dropping a pricier one saves more but depends on which
    // the user prefers, and we do not guess. With 3+ services we still count only one drop.
    const saving = Math.round(cheapest.annualCost);
    const names = byCost.map((s) => s.merchantName);
    const renews = addDays(cheapest.lastSeen, cheapest.cadence === 'annual' ? 365 : cheapest.cadence === 'weekly' ? 7 : 30);

    out.push({
      merchantId: cheapest.merchantId,
      finding: {
        id: `overlap:${category}`,
        kind: 'overlap',
        title: `${joinNames(names)} do the same job`,
        detail: `You pay for ${services.length} ${spec.label} services (${byCost.map((s) => `${s.merchantName} ${perPeriod(s)}`).join(', ')}). Keep the one you use most. Dropping even the cheapest, ${cheapest.merchantName}, saves about ${money(saving)} a year.`,
        annualSavings: { low: saving, high: saving },
        evidence: byCost.flatMap(recentIds),
        rule: `${spec.minServices}+ paid ${spec.label} services on the same statement.`,
        sources: [],
        kit: [
          { title: 'Pick the one you will keep', body: `Look at which of ${joinNames(names)} you actually opened this month. Keep that one.` },
          { title: 'Cancel the other before it renews', body: `${cheapest.merchantName} last charged on ${prettyDate(cheapest.lastSeen)}, so expect the next charge around ${prettyDate(renews)}. Cancel in the app or on the website's account page before then.` },
          { title: 'Check next month', body: `Come back after your next statement and confirm the ${cheapest.merchantName} charge is gone.` },
        ],
        confidence: 'high',
        assumptions: [`Assumes one ${spec.label} service is enough for you.`],
      },
    });
  }
  return out;
}
