/**
 * Twice engine contract — SOURCE OF TRUTH for every shape that crosses a module
 * or package boundary. apps/web imports only from `@twice/engine` (src/index.ts).
 *
 * AGENT: change a type here first, then fix the compiler errors it causes.
 * Never redefine these shapes in apps/web. Every non-obvious field carries a
 * DECISION comment; keep that habit when you add fields.
 */

// ─── Input ──────────────────────────────────────────────────────────────────

// DECISION(formats): the five biggest US card/checking exporters plus a generic
// date/description/amount fallback cover what a judge can realistically upload.
// OFX/QFX is dying (BofA dropped it 2025-09-30) and PDF needs heavier parsing,
// so both are roadmap, not v0.
export type BankFormat =
  | 'chase_card'
  | 'chase_checking'
  | 'amex'
  | 'bofa_checking'
  | 'bofa_card'
  | 'capital_one'
  | 'discover'
  | 'generic';

export interface Transaction {
  /** `${fileIndex}:${rowIndex}` — stable for the session; UI edits keep the id. */
  id: string;
  /** ISO yyyy-mm-dd. Transaction date when the export has both trans/post dates. */
  date: string;
  /** Raw descriptor exactly as exported, e.g. "SQ *BLUE BOTTLE 1234 OAKLAND CA". */
  description: string;
  // DECISION(sign): ONE sign convention for the whole engine: positive = money
  // out (a charge), negative = money in (refund, payment, deposit). Each bank
  // parser flips its own sign (Chase/BofA cards export purchases negative,
  // Amex/Discover positive). Code after the parser never looks at `format`.
  amount: number;
  format: BankFormat;
}

export interface ParseResult {
  format: BankFormat;
  transactions: Transaction[];
  /** Rows dropped: blank lines, BofA summary preamble, unparseable date/amount. */
  skippedRows: number;
  // DECISION(no-throw): parsers never throw on a bad row — a judge's real file
  // must still produce a result. Problems surface here and in the UI banner.
  warnings: string[];
}

// ─── Catalog (packages/engine/data/*.json) ──────────────────────────────────
// DECISION(sourced-data): every fact a finding relies on (a price, a perk, a
// port-out step) lives in a JSON row with `url` + `checkedOn`. The engine never
// invents a number; the UI shows the source next to every saving. Judges read
// the repo, and "core value is real, not hardcoded" is 40% of the grade.

export type MerchantCategory =
  | 'streaming_video'
  | 'music'
  | 'cloud_storage'
  | 'delivery'
  | 'membership'
  | 'wireless'
  | 'gym'
  | 'news'
  | 'software'
  | 'other';

export type NetworkId = 'verizon' | 'tmobile' | 'att';

/** data/merchants.json — descriptor patterns → canonical merchant. */
export interface MerchantRow {
  /** snake_case id, e.g. "netflix", "tmobile", "walmart_plus". */
  id: string;
  name: string;
  category: MerchantCategory;
  /** Case-insensitive regex sources tested against the NORMALIZED descriptor. */
  patterns: string[];
  /** Wireless merchants only: id of the matching row in carriers.json. */
  carrierId?: string;
}

/** data/carriers.json — the carrier a user pays today. */
export interface CarrierRow {
  /** "verizon" | "att" | "tmobile" | "visible" | "mint" | "cricket" | ... */
  id: string;
  name: string;
  network: NetworkId;
  // DECISION(big-three): we only suggest LEAVING the big three postpaid brands.
  // Someone already on an MVNO gets no phone finding — that is the honest
  // "you're already on a good deal" path judges should be able to see.
  isBigThree: boolean;
  /** Ordered port-out steps (transfer PIN, account number, timing). */
  portOut: KitStep[];
  /** e.g. Verizon's device-lock rule; shown as warnings inside the switch kit. */
  warnings: string[];
  url: string;
  checkedOn: string;
}

/** data/plans.json — plans we may recommend: MVNO/prepaid on a big-3 network. */
export interface PlanRow {
  id: string;
  brand: string;
  name: string;
  network: NetworkId;
  // DECISION(regular-price): savings math uses the REGULAR monthly price per
  // line (after a required autopay discount), never a first-term promo. Promos
  // are shown separately so the headline number survives month 4.
  monthlyPerLine: number;
  /** Optional total monthly price keyed by line count ("2": 50) when multi-line pricing differs. */
  monthlyTotalByLines?: Record<string, number>;
  taxesIncluded: boolean;
  promo?: string;
  /** ≤3 short facts for the card, e.g. "Unlimited data", "Hotspot included". */
  highlights: string[];
  url: string;
  checkedOn: string;
}

/** data/perks.json — a service included free with something the user already pays for. */
export interface PerkRow {
  id: string;
  /** The card / phone plan / membership that includes the perk. */
  provider: { id: string; name: string; kind: 'card' | 'phone_plan' | 'membership' };
  /** merchants.json id of the service the user may ALSO be paying for directly. */
  includesMerchantId: string;
  /** Tier that is included, e.g. "Netflix Standard with ads". */
  includedTier: string;
  // DECISION(perk-value): the conservative (low) saving is the price of the
  // INCLUDED tier — perks are often ad tiers, so crediting the user's premium
  // price as the floor would overstate savings. High = what they pay today.
  includedTierMonthly: number;
  // DECISION(perk-detection): 'statement' = we see the provider's own charge
  // (e.g. Walmart+). 'quiz' = we must ask (cards don't bill monthly; phone-plan
  // tier is invisible in a descriptor). Quiz perks only fire after the user
  // confirms, so we never claim a perk the user might not have.
  detection: 'statement' | 'quiz';
  /** merchants.json id of the provider's charge when detection === 'statement'. */
  providerMerchantId?: string;
  /** phone_plan perks: carriers.json id, so the quiz only asks T-Mobile users about T-Mobile plans. */
  carrierId?: string;
  /** Plain-English eligibility, e.g. "Experience More and Beyond plans only". */
  conditions: string;
  /** Steps: activate the perk, wait for overlap, then cancel the direct subscription. */
  kit: KitStep[];
  url: string;
  checkedOn: string;
}

export interface Catalog {
  merchants: MerchantRow[];
  carriers: CarrierRow[];
  plans: PlanRow[];
  perks: PerkRow[];
}

// ─── Analysis ───────────────────────────────────────────────────────────────

export interface PriceStep {
  date: string;
  from: number;
  to: number;
  transactionId: string;
}

export interface RecurringCharge {
  /** merchants.json id, or `unknown:<normalized descriptor>` for uncatalogued merchants. */
  merchantId: string;
  merchantName: string;
  category: MerchantCategory;
  cadence: 'weekly' | 'monthly' | 'annual';
  /** Latest charge amount, USD. */
  currentAmount: number;
  /** currentAmount × periods per year. */
  annualCost: number;
  /** Every charge in the series — the evidence rows the UI shows. */
  transactionIds: string[];
  firstSeen: string;
  lastSeen: string;
  priceSteps: PriceStep[];
}

/** Quiz answers. Everything optional: the engine works with none of them. */
export interface Profile {
  /** Lines on the wireless bill. Unknown → engine estimates and marks confidence 'medium'. */
  phoneLines?: number;
  /** Provider ids (PerkRow.provider.id) the user says they have: cards, phone-plan tiers. */
  perkProviders?: string[];
}

// DECISION(adaptive-quiz): the engine — not the UI — decides which questions
// matter, from what it found. A user with no wireless charge is never asked
// about phone lines. Keeps the funnel short (Zimran-style) and the logic testable.
export interface Question {
  id: 'phoneLines' | 'perkProviders';
  prompt: string;
  /** Why we ask — shown under the question ("Your Verizon bill is $165/mo"). */
  reason: string;
  kind: 'number' | 'multi';
  options?: { value: string; label: string }[];
}

export type FindingKind = 'paying_twice' | 'overlap' | 'phone_switch' | 'price_step';

export interface Source {
  label: string;
  url: string;
  checkedOn: string;
}

export interface KitStep {
  title: string;
  body: string;
}

export interface Finding {
  /** Deterministic, e.g. "paying_twice:tmobile_experience_more:netflix". */
  id: string;
  kind: FindingKind;
  /** "Netflix is already included in your T-Mobile plan". */
  title: string;
  /** One plain-English sentence. */
  detail: string;
  /** USD per year, rounded to whole dollars, low ≤ high. price_step findings use {0, 0}. */
  annualSavings: { low: number; high: number };
  /** price_step only: how much more per year than before the increase. */
  annualIncrease?: number;
  /** Transaction ids that prove it — the UI renders these rows. */
  evidence: string[];
  /** The rule that fired, in plain English ("Same Verizon network, $25/line"). */
  rule: string;
  sources: Source[];
  kit: KitStep[];
  /** 'medium' when the number rests on an assumption listed in `assumptions`. */
  confidence: 'high' | 'medium';
  assumptions: string[];
  /** phone_switch only: recommended plans, cheapest first. */
  alternatives?: { planId: string; brand: string; name: string; monthlyTotal: number; url: string }[];
}

export interface Analysis {
  recurring: RecurringCharge[];
  /** Sorted by annualSavings.high desc; price_step findings last. */
  findings: Finding[];
  totals: {
    // DECISION(no-double-count): a merchant's saving counts once in the total
    // even if two findings mention it (e.g. paying_twice + overlap on Netflix).
    annualLow: number;
    annualHigh: number;
    /** Sum of annualCost over all recurring charges — "you spend $X/yr on recurring". */
    recurringAnnual: number;
  };
  /** Follow-up questions that would sharpen the findings. Empty when nothing to ask. */
  needs: Question[];
}

/** fixtures/personas.json — synthetic sample statements for the no-login jury demo. */
export interface Persona {
  id: string;
  name: string;
  /** One line: who they are and what they pay. */
  blurb: string;
  /** File name in fixtures/, e.g. "maya_chase_card.csv". */
  file: string;
  format: BankFormat;
  /** Quiz answers the demo pre-fills (the judge can change them). */
  profile: Profile;
}
