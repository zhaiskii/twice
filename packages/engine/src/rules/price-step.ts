/**
 * Owns: finding kind `price_step` — a subscription quietly got more expensive.
 * Informational only: claims no savings (and we never negotiate — AGENTS.md rule 5).
 */
import { prettyDate } from '../dates';
import { money, perPeriod } from '../text';
import type { RecurringCharge } from '../types';
import type { KeyedFinding, RuleContext } from './context';

const PERIODS_PER_YEAR = { weekly: 52, monthly: 12, annual: 1 } as const;
const PERIOD_WORD = { weekly: 'week', monthly: 'month', annual: 'year' } as const;

function priceStepFor(series: RecurringCharge): KeyedFinding | null {
  const first = series.priceSteps[0];
  if (!first) return null;
  // DECISION(step-baseline): compare today's price with the price BEFORE the first step, so two
  // hikes in a year read as one cumulative increase. A net decrease is not a finding.
  const increase = Math.round((series.currentAmount - first.from) * PERIODS_PER_YEAR[series.cadence]);
  if (increase <= 0) return null;

  const stepIds = new Set(series.priceSteps.map((s) => s.transactionId));
  // Evidence: each step charge and the charge just before it, so the UI shows old price → new price.
  const evidence = series.transactionIds.filter((id, i) => stepIds.has(id) || stepIds.has(series.transactionIds[i + 1] ?? ''));
  const word = PERIOD_WORD[series.cadence];

  return {
    merchantId: null,
    finding: {
      id: `price_step:${series.merchantId}`,
      kind: 'price_step',
      title: `${series.merchantName} went up to ${perPeriod(series)}`,
      detail: `Your ${series.merchantName} charge rose from ${money(first.from)} to ${money(first.to)} on ${prettyDate(first.date)}${series.priceSteps.length > 1 ? ` and has risen again since (now ${money(series.currentAmount)})` : ''}. That is about ${money(increase)} more per year.`,
      annualSavings: { low: 0, high: 0 },
      annualIncrease: increase,
      evidence,
      rule: `The charge rose by at least $0.50 and 3% and the higher price kept applying each ${word}.`,
      sources: [],
      kit: [],
      confidence: 'high',
      assumptions: [],
    },
  };
}

export function priceStepFindings(ctx: RuleContext): KeyedFinding[] {
  return ctx.recurring.flatMap((s) => priceStepFor(s) ?? []);
}
