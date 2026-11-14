/**
 * Owns: bank descriptor → canonical merchant (SPEC pipeline step 1).
 *   normalizeDescriptor()  strips processor prefixes, store numbers, phones, dates, city/state
 *   classify()             matches the normalized text against merchants.json patterns
 * Pure and memoized per descriptor, because analyze() reruns on every keystroke.
 */
import type { MerchantCategory, MerchantRow, Transaction } from './types';

// ─── Normalization ──────────────────────────────────────────────────────────

/** Bank-added words before the merchant: "PURCHASE 1031 ", "CHECKCARD 1104 ", "PURCHASE AUTHORIZED ON 11/03 ". */
const BANK_BOILERPLATE =
  /^(?:PURCHASE AUTHORIZED ON|RECURRING PAYMENT AUTHORIZED ON|RECURRING PAYMENT|RECURRING CARD PURCHASE|DEBIT CARD PURCHASE|POS PURCHASE|POS DEBIT|CHECK ?CARD|PURCHASE)\s+(?:\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\s+|\d{4}\s+)?/;

/**
 * Payment-processor prefixes ("SQ *BLUE BOTTLE", "PAYPAL *NETFLIX", "GOOGLE *Google One").
 * DECISION(prefix-strip): "GOOGLE *" and "DD *" are stripped so the service behind them
 * ("GOOGLE ONE", "DASHPASS") is what gets matched. UBER is NOT here: "UBER *ONE" vs "UBER *TRIP"
 * is exactly the distinction we need. APPLE.COM/BILL is kept whole (see merchants.json).
 */
const PROCESSOR_PREFIX = /^(?:SQ|TST|SP|PP|PAYPAL|PYPL|GOOGLE|DD|CKO|IC|PY)\s*\*\s*|^(?:APLPAY|APPLE PAY)\s+/;

const URL_NOISE = /\bHTTPS?:\/\/|\bWWW\./g;
const DATE_NOISE = /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g;
const PHONE_NOISE = /\b(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}\b|\b\d{3}-\d{7}\b/g;
const CARD_NOISE = /\b[X*]{2,}\d{2,4}\b|#\s*\d+/g;
/** Pure digits, or 5+ char mixed letter+digit reference codes like "P1A2B3" / "2K4AB3". */
const REFERENCE_TOKEN = /^\d+$|^(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{5,}$/;

const US_STATES = new Set(
  'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' '),
);

function stripPrefixes(s: string): string {
  let out = s.replace(BANK_BOILERPLATE, '');
  // Loop: "PAYPAL *SQ *FOO" is legal. Capped at 3 so a weird string can never spin.
  for (let i = 0; i < 3; i++) {
    const next = out.replace(PROCESSOR_PREFIX, '');
    if (next === out) break;
    out = next;
  }
  return out;
}

export function normalizeDescriptor(raw: string): string {
  const upper = raw.toUpperCase().replace(/\s+/g, ' ').trim();
  const stripped = stripPrefixes(upper)
    // A `*` inside a descriptor separates processor from merchant ("TMOBILE*AUTO PAY", "UBER *ONE").
    .replace(/\*/g, ' ')
    .replace(URL_NOISE, '')
    .replace(DATE_NOISE, ' ')
    .replace(PHONE_NOISE, ' ')
    .replace(CARD_NOISE, ' ');

  const tokens = stripped.split(' ').filter((t) => t !== '' && !REFERENCE_TOKEN.test(t));
  // DECISION(state-suffix): drop ONE trailing US state code ("… LOS GATOS CA"). The city stays:
  // it is constant per merchant, so it keeps the `unknown:` key stable without a city list.
  const last = tokens[tokens.length - 1];
  if (tokens.length > 1 && last !== undefined && US_STATES.has(last)) tokens.pop();

  // Nothing left (descriptor was all numbers): fall back to the raw text so the key is never empty.
  return tokens.join(' ') || upper;
}

// ─── Matching ───────────────────────────────────────────────────────────────

export interface MerchantMatch {
  merchantId: string;
  merchantName: string;
  category: MerchantCategory;
  /** True when the merchant came from merchants.json (vs an `unknown:` guess). */
  known: boolean;
  carrierId?: string;
  /** False for uncatalogued transfers/rent/checks: they repeat monthly but are not subscriptions. */
  subscriptionLike: boolean;
}

export interface Classified extends MerchantMatch {
  tx: Transaction;
}

/**
 * DECISION(not-subscriptions): uncatalogued descriptors that are really money movement
 * (Zelle, card payments, rent, ATM, checks) repeat every month and would otherwise show up as
 * "recurring charges" and inflate "you spend $X/yr on recurring". Catalogued merchants are exempt
 * ("ATT*BILL PAYMENT" contains PAYMENT but is a phone bill). Revisit if users report missed items.
 */
const MONEY_MOVEMENT =
  /\b(?:ZELLE|VENMO|CASH APP|PAYMENT|PMT|AUTOPAY|AUTO PAY|EPAYMENT|TRANSFER|XFER|ATM|WITHDRAWAL|DEPOSIT|PAYROLL|CHECK|WIRE|RENT|MORTGAGE|LANDLORD|INTEREST|CREDIT CRD|CREDIT CARD)\b/;

interface CompiledMerchant {
  row: MerchantRow;
  patterns: RegExp[];
}

function compile(rows: MerchantRow[]): CompiledMerchant[] {
  return rows.map((row) => ({
    row,
    patterns: row.patterns.flatMap((p) => {
      try {
        return [new RegExp(p, 'i')];
      } catch {
        // DECISION(bad-pattern): a malformed regex in merchants.json drops that one pattern
        // instead of crashing every analysis. merchants.test.ts fails loudly on it in CI.
        return [];
      }
    }),
  }));
}

interface MatcherCache {
  compiled: CompiledMerchant[];
  memo: Map<string, MerchantMatch>;
}

// WeakMap keyed by the merchants array: tests inject tiny catalogs, the app uses one bundled
// catalog, and compiled regexes are reused across every analyze() call.
const caches = new WeakMap<MerchantRow[], MatcherCache>();
// DECISION(memo-cap): editing a description in the UI creates one new descriptor per
// keystroke; clear the memo if it ever grows past this rather than keep every string.
const MEMO_LIMIT = 5000;

function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|[\s/-])([a-z])/g, (_m, sep: string, c: string) => sep + c.toUpperCase());
}

function matchOne(raw: string, compiled: CompiledMerchant[]): MerchantMatch {
  const normalized = normalizeDescriptor(raw);
  for (const { row, patterns } of compiled) {
    if (patterns.some((p) => p.test(normalized))) {
      return {
        merchantId: row.id,
        merchantName: row.name,
        category: row.category,
        known: true,
        ...(row.carrierId ? { carrierId: row.carrierId } : {}),
        subscriptionLike: true,
      };
    }
  }
  return {
    merchantId: `unknown:${normalized}`,
    merchantName: titleCase(normalized),
    category: 'other',
    known: false,
    subscriptionLike: !MONEY_MOVEMENT.test(normalized),
  };
}

/** Match a single descriptor against the merchant catalog. */
export function matchMerchant(raw: string, merchants: MerchantRow[]): MerchantMatch {
  let cache = caches.get(merchants);
  if (!cache) {
    cache = { compiled: compile(merchants), memo: new Map() };
    caches.set(merchants, cache);
  }
  const hit = cache.memo.get(raw);
  if (hit) return hit;
  const match = matchOne(raw, cache.compiled);
  if (cache.memo.size >= MEMO_LIMIT) cache.memo.clear();
  cache.memo.set(raw, match);
  return match;
}

export function classify(transactions: Transaction[], merchants: MerchantRow[]): Classified[] {
  return transactions.map((tx) => ({ ...matchMerchant(tx.description, merchants), tx }));
}
