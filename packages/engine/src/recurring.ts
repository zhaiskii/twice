/**
 * Owns: SPEC pipeline step 2 — turning classified charges into recurring series
 * (weekly / monthly / annual) and detecting persistent price steps.
 * Only charges (amount > 0) are ever considered; refunds never start or join a series.
 */
import { dayNumber } from './dates';
import type { Classified } from './normalize';
import type { MerchantCategory, PriceStep, RecurringCharge } from './types';

interface Charge {
  id: string;
  date: string;
  day: number;
  amount: number;
}

interface CadenceRule {
  cadence: RecurringCharge['cadence'];
  periodsPerYear: number;
  /** Allowed days between two consecutive charges in the series. */
  gap: [number, number];
  /** Optional longer gap that counts as one missed period (at most `maxSkips` times). */
  skipGap?: [number, number];
  maxSkips: number;
  /** Charges needed for a catalogued merchant / an unknown one. */
  minKnown: number;
  minUnknown: number;
}

// DECISION(cadence-windows): gaps come straight from SPEC step 2. Monthly 25–35 covers 28–31 day
// months plus a few days of billing drift; the skip window 55–70 is "one missed month" (≈2 periods).
// Weekly needs ≥4 charges because two charges 7 days apart is common for ordinary shopping.
const MONTHLY: CadenceRule = { cadence: 'monthly', periodsPerYear: 12, gap: [25, 35], skipGap: [55, 70], maxSkips: 1, minKnown: 2, minUnknown: 3 };
const WEEKLY: CadenceRule = { cadence: 'weekly', periodsPerYear: 52, gap: [6, 8], maxSkips: 0, minKnown: 4, minUnknown: 4 };
const ANNUAL: CadenceRule = { cadence: 'annual', periodsPerYear: 1, gap: [350, 380], maxSkips: 0, minKnown: 2, minUnknown: 2 };
const RULES = [MONTHLY, WEEKLY, ANNUAL];

// DECISION(unknown-amount-tolerance): an uncatalogued merchant must charge (nearly) the same amount
// each time — ±5% — or a grocery store you visit monthly would look like a subscription.
// Wireless bills drift with taxes and usage, so they get ±25% — and that check also applies to
// CATALOGUED wireless merchants, so a one-off phone purchase at T-Mobile never pairs with the monthly
// bill. Other catalogued merchants are trusted on name alone. Side effect: an uncatalogued service
// whose price jumps >5% loses its series.
const UNKNOWN_TOLERANCE = 0.05;
const WIRELESS_TOLERANCE = 0.25;

// DECISION(single-annual): one yearly membership fee (Amazon Prime, Costco) shows up once in a
// 12-month statement. A catalogued `membership` merchant with one charge ≥ $50 is read as annual;
// below $50 a lone charge is more likely a one-off purchase.
const ANNUAL_MEMBERSHIP_MIN = 50;

// DECISION(dominant-series): an UNCATALOGUED merchant only counts as recurring when its series is at
// least half of ALL its charges. A store you visit 20 times (Trader Joe's, Uber rides) will always
// contain 2–3 charges that happen to fit a cadence and amount band; a subscription's charges are
// nearly all in the series. Catalogued merchants skip this check (we know what they are).
const UNKNOWN_MIN_SHARE = 0.5;

// DECISION(price-step): from SPEC. A step is a change of at least $0.50 AND 3% — smaller wobble is
// tax or rounding. It must persist to the latest charge, or last ≥2 charges, so a one-month blip
// (a late fee, a one-time add-on) is not reported as a price hike.
const STEP_MIN_DOLLARS = 0.5;
const STEP_MIN_FRACTION = 0.03;
const STEP_MIN_PERSIST = 2;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Walk charges in date order and keep the longest run whose consecutive gaps fit the rule.
 * Charges closer together than the minimum gap (a second charge in the same cycle) are ignored
 * rather than breaking the run; a gap that fits no window starts a new run. Ties favour the latest run.
 */
function longestChain(charges: Charge[], rule: CadenceRule): Charge[] {
  let best: Charge[] = [];
  let run: Charge[] = [];
  let skips = 0;
  for (const charge of charges) {
    const last = run[run.length - 1];
    if (!last) {
      run = [charge];
      continue;
    }
    const gap = charge.day - last.day;
    if (gap < rule.gap[0]) continue;
    if (gap <= rule.gap[1]) {
      run.push(charge);
    } else if (rule.skipGap && skips < rule.maxSkips && gap >= rule.skipGap[0] && gap <= rule.skipGap[1]) {
      run.push(charge);
      skips++;
    } else {
      if (run.length >= best.length) best = run;
      run = [charge];
      skips = 0;
    }
  }
  return run.length >= best.length ? run : best;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

function amountsConsistent(chain: Charge[], category: MerchantCategory): boolean {
  const tolerance = category === 'wireless' ? WIRELESS_TOLERANCE : UNKNOWN_TOLERANCE;
  const mid = median(chain.map((c) => c.amount));
  return chain.every((c) => Math.abs(c.amount - mid) <= mid * tolerance);
}

function isStep(from: number, to: number): boolean {
  const delta = Math.abs(to - from);
  return delta >= STEP_MIN_DOLLARS && delta >= from * STEP_MIN_FRACTION;
}

/** Price changes in a chain that stay in effect (see DECISION(price-step)). */
export function findPriceSteps(chain: Charge[]): PriceStep[] {
  const steps: PriceStep[] = [];
  // DECISION(step-baseline): compare each charge with the last price that STUCK, not with the charge
  // before it. Otherwise a one-month blip (7.99 → 14.99 → 7.99) would leave a phantom "step down"
  // from the blip price, and slow creep (165 → 169 → 173) would never add up to a step.
  let baseline = chain[0]?.amount ?? 0;
  for (let i = 1; i < chain.length; i++) {
    const cur = chain[i]!;
    if (!isStep(baseline, cur.amount)) continue;
    // How many consecutive charges (from i on) stay at this new price?
    let run = 1;
    while (i + run < chain.length && !isStep(cur.amount, chain[i + run]!.amount)) run++;
    const persistsToLatest = i + run === chain.length;
    if (persistsToLatest || run >= STEP_MIN_PERSIST) {
      steps.push({ date: cur.date, from: baseline, to: cur.amount, transactionId: cur.id });
      baseline = cur.amount;
    }
  }
  return steps;
}

interface Group {
  meta: Classified;
  charges: Charge[];
}

function groupCharges(classified: Classified[]): Group[] {
  const groups = new Map<string, Group>();
  for (const c of classified) {
    // Skips refunds/payments (<= 0), NaN amounts and unparseable dates (a half-typed edit in the UI).
    if (!(c.tx.amount > 0) || !c.subscriptionLike) continue;
    const day = dayNumber(c.tx.date);
    if (Number.isNaN(day)) continue;
    let group = groups.get(c.merchantId);
    if (!group) groups.set(c.merchantId, (group = { meta: c, charges: [] }));
    group.charges.push({ id: c.tx.id, date: c.tx.date, day, amount: c.tx.amount });
  }
  for (const g of groups.values()) g.charges.sort((a, b) => a.day - b.day || (a.id < b.id ? -1 : 1));
  return [...groups.values()];
}

function seriesFor(group: Group): { rule: CadenceRule; chain: Charge[] } | null {
  const { meta, charges } = group;
  for (const rule of RULES) {
    const chain = longestChain(charges, rule);
    const needed = meta.known ? rule.minKnown : rule.minUnknown;
    if (chain.length < needed) continue;
    if ((!meta.known || meta.category === 'wireless') && !amountsConsistent(chain, meta.category)) continue;
    if (!meta.known && chain.length < charges.length * UNKNOWN_MIN_SHARE) continue;
    return { rule, chain };
  }
  const latest = charges[charges.length - 1];
  if (meta.known && meta.category === 'membership' && latest && latest.amount >= ANNUAL_MEMBERSHIP_MIN) {
    return { rule: ANNUAL, chain: [latest] };
  }
  return null;
}

export function detectRecurring(classified: Classified[]): RecurringCharge[] {
  const out: RecurringCharge[] = [];
  for (const group of groupCharges(classified)) {
    const found = seriesFor(group);
    if (!found) continue;
    const { rule, chain } = found;
    const first = chain[0]!;
    const last = chain[chain.length - 1]!;
    out.push({
      merchantId: group.meta.merchantId,
      merchantName: group.meta.merchantName,
      category: group.meta.category,
      cadence: rule.cadence,
      currentAmount: last.amount,
      annualCost: round2(last.amount * rule.periodsPerYear),
      transactionIds: chain.map((c) => c.id),
      firstSeen: first.date,
      lastSeen: last.date,
      priceSteps: findPriceSteps(chain),
    });
  }
  // Deterministic order: biggest yearly cost first, id as tie-break.
  return out.sort((a, b) => b.annualCost - a.annualCost || (a.merchantId < b.merchantId ? -1 : 1));
}
