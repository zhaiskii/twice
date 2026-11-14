/**
 * Owns: recognising which bank exported a CSV (from its header row) and mapping
 * rows to `Transaction` with the engine's single sign convention (positive =
 * money out, see types.ts DECISION(sign)). Never throws; problems become
 * `skippedRows` / `warnings`.
 */
import { parseCsv } from './csv';
import { parseAmount, parseDate } from './values';
import type { BankFormat, ParseResult, Transaction } from './types';

/** How to turn the exported amount into "positive = money out". */
type SignRule =
  | { kind: 'fixed'; multiplier: 1 | -1 }
  // DECISION(sign-infer): when a layout is shared by banks with opposite conventions
  // (3-column Amex vs any generic file), infer from the data: money-out rows are the
  // MAJORITY (many small purchases vs a few payments/deposits). `defaultPositiveOut`
  // only breaks ties.
  | { kind: 'infer'; defaultPositiveOut: boolean };

interface Layout {
  format: BankFormat;
  date: number;
  description: number;
  /** Single signed amount column… */
  amount?: number;
  /** …or separate debit / credit columns (Capital One). */
  debit?: number;
  credit?: number;
  sign: SignRule;
}

/** A known export: header names that must all be present, and which columns to read. */
interface KnownSpec {
  format: BankFormat;
  /** Lower-cased header cells that must ALL appear. */
  requires: string[];
  /** Exact header count, for layouts that are a strict subset of another (3-col Amex). */
  columnCount?: number;
  date: string;
  description: string;
  amount?: string;
  debit?: string;
  credit?: string;
  sign: SignRule;
}

// AGENT: if you add a bank, add its header here, a fixture row in formats.test.ts and the
// BankFormat in types.ts. Order matters only where one header is a superset of another.
const KNOWN_SPECS: KnownSpec[] = [
  // Purchases are NEGATIVE, payments POSITIVE.
  { format: 'chase_card', requires: ['transaction date', 'post date', 'description', 'amount'], date: 'transaction date', description: 'description', amount: 'amount', sign: { kind: 'fixed', multiplier: -1 } },
  // Debits negative.
  { format: 'chase_checking', requires: ['details', 'posting date', 'description', 'amount'], date: 'posting date', description: 'description', amount: 'amount', sign: { kind: 'fixed', multiplier: -1 } },
  // Debits negative. The header sits below a summary preamble; header search handles that.
  { format: 'bofa_checking', requires: ['date', 'description', 'amount', 'running bal.'], date: 'date', description: 'description', amount: 'amount', sign: { kind: 'fixed', multiplier: -1 } },
  // Purchases negative.
  { format: 'bofa_card', requires: ['posted date', 'reference number', 'payee', 'amount'], date: 'posted date', description: 'payee', amount: 'amount', sign: { kind: 'fixed', multiplier: -1 } },
  // Debit column = money out, Credit column = money in; both positive numbers.
  { format: 'capital_one', requires: ['transaction date', 'posted date', 'description', 'debit', 'credit'], date: 'transaction date', description: 'description', debit: 'debit', credit: 'credit', sign: { kind: 'fixed', multiplier: 1 } },
  // Purchases POSITIVE.
  { format: 'discover', requires: ['trans. date', 'post date', 'description', 'amount'], date: 'trans. date', description: 'description', amount: 'amount', sign: { kind: 'fixed', multiplier: 1 } },
  // Charges POSITIVE, credits negative.
  { format: 'amex', requires: ['date', 'description', 'card member', 'amount'], date: 'date', description: 'description', amount: 'amount', sign: { kind: 'fixed', multiplier: 1 } },
  // DECISION(amex-3col): `Date,Description,Amount` is Amex's short export, but a hand-made
  // or generic file looks identical. Label it amex (positive = charge) and let the data
  // overrule the label if most rows are negative.
  { format: 'amex', requires: ['date', 'description', 'amount'], columnCount: 3, date: 'date', description: 'description', amount: 'amount', sign: { kind: 'infer', defaultPositiveOut: true } },
];

// How far down to look for the header row. BofA's summary preamble is ~6 lines; 30 leaves room
// for other banks' notes without scanning a whole file for a header that is not there.
const HEADER_SEARCH_ROWS = 30;

const normalizeHeader = (cell: string) => cell.trim().toLowerCase();

function indexOfHeader(headers: string[], name: string | undefined): number {
  return name === undefined ? -1 : headers.indexOf(name);
}

function matchKnown(headers: string[]): Layout | null {
  for (const spec of KNOWN_SPECS) {
    if (spec.columnCount !== undefined && headers.length !== spec.columnCount) continue;
    if (!spec.requires.every((h) => headers.includes(h))) continue;
    const layout: Layout = {
      format: spec.format,
      date: indexOfHeader(headers, spec.date),
      description: indexOfHeader(headers, spec.description),
      sign: spec.sign,
    };
    if (spec.amount) layout.amount = indexOfHeader(headers, spec.amount);
    if (spec.debit) layout.debit = indexOfHeader(headers, spec.debit);
    if (spec.credit) layout.credit = indexOfHeader(headers, spec.credit);
    return layout;
  }
  return null;
}

const DESCRIPTION_WORDS = ['description', 'payee', 'merchant', 'name', 'details', 'narrative', 'memo'];

/** First header that contains `word`, preferring earlier words in the list. */
function findByWords(headers: string[], words: string[], exclude: (h: string) => boolean = () => false): number {
  for (const word of words) {
    const i = headers.findIndex((h) => h.includes(word) && !exclude(h));
    if (i >= 0) return i;
  }
  return -1;
}

function matchGeneric(headers: string[]): Layout | null {
  // Prefer the transaction date over the posting date (types.ts: Transaction.date).
  const date = headers.findIndex((h) => h.includes('date') && !h.includes('post'));
  const anyDate = date >= 0 ? date : headers.findIndex((h) => h.includes('date'));
  const description = findByWords(headers, DESCRIPTION_WORDS, (h) => h.includes('date'));
  if (anyDate < 0 || description < 0) return null;

  const amount = headers.findIndex((h) => h.includes('amount'));
  const debit = findByWords(headers, ['debit', 'withdrawal', 'money out']);
  const credit = findByWords(headers, ['credit', 'deposit', 'money in']);
  const base = { format: 'generic' as const, date: anyDate, description };
  if (amount >= 0) return { ...base, amount, sign: { kind: 'infer', defaultPositiveOut: false } };
  if (debit >= 0 && credit >= 0) return { ...base, debit, credit, sign: { kind: 'fixed', multiplier: 1 } };
  return null;
}

/** Scan the top of the file for the first row that looks like a header. */
export function detectLayout(rows: string[][]): { layout: Layout; headerRow: number } | null {
  const limit = Math.min(rows.length, HEADER_SEARCH_ROWS);
  for (let r = 0; r < limit; r++) {
    const headers = (rows[r] ?? []).map(normalizeHeader);
    const layout = matchKnown(headers) ?? matchGeneric(headers);
    if (layout) return { layout, headerRow: r };
  }
  return null;
}

interface RawRow {
  id: string;
  date: string;
  description: string;
  value: number;
}

/**
 * DECISION(sign-infer-threshold): 60% of non-zero rows must agree before we override the
 * default. Below that (e.g. a statement with as many deposits as spends) the file is
 * ambiguous and we keep the default rather than flip on noise.
 */
const INFER_MAJORITY = 0.6;

function resolveMultiplier(rule: SignRule, values: number[], warnings: string[]): 1 | -1 {
  if (rule.kind === 'fixed') return rule.multiplier;
  let positive = 0;
  let negative = 0;
  for (const v of values) {
    if (v > 0) positive++;
    else if (v < 0) negative++;
  }
  const total = positive + negative;
  let positiveOut = rule.defaultPositiveOut;
  if (total > 0 && positive / total >= INFER_MAJORITY) positiveOut = true;
  else if (total > 0 && negative / total >= INFER_MAJORITY) positiveOut = false;
  warnings.push(
    positiveOut
      ? 'Treated positive amounts as charges (most rows are positive). Edit amounts if that looks wrong.'
      : 'Treated negative amounts as charges (most rows are negative). Edit amounts if that looks wrong.',
  );
  return positiveOut ? 1 : -1;
}

function cell(row: string[], index: number | undefined): string {
  return index === undefined || index < 0 ? '' : (row[index] ?? '');
}

/** The raw text of the amount cell(s): used to tell "balance line with no amount" from "bad amount". */
function amountText(row: string[], layout: Layout): string {
  return layout.amount !== undefined ? cell(row, layout.amount) : cell(row, layout.debit) + cell(row, layout.credit);
}

function readAmount(row: string[], layout: Layout): number | null {
  if (layout.amount !== undefined) return parseAmount(cell(row, layout.amount));
  const debit = parseAmount(cell(row, layout.debit));
  const credit = parseAmount(cell(row, layout.credit));
  if (debit === null && credit === null) return null;
  // abs(): some exports print the debit column as negative; the column, not the sign, says direction.
  return Math.abs(debit ?? 0) - Math.abs(credit ?? 0);
}

/** Parse one bank CSV export. Never throws. */
export function parseBankCsv(csv: string, fileIndex: number): ParseResult {
  const rows = parseCsv(csv);
  const found = detectLayout(rows);
  if (!found) {
    return {
      format: 'generic',
      transactions: [],
      skippedRows: rows.length,
      warnings: ["We couldn't find a header row with date, description and amount columns. Is this a bank or card CSV export?"],
    };
  }

  const { layout, headerRow } = found;
  const raw: RawRow[] = [];
  let skipped = headerRow; // preamble rows above the header
  let unreadable = 0;
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const date = parseDate(cell(row, layout.date));
    const value = readAmount(row, layout);
    if (date === null || value === null) {
      skipped++;
      // DECISION(quiet-skips): only warn when there was an amount-like cell we could not use, or a
      // real amount with a bad date. Blank lines, BofA's "Beginning balance" row (date, no amount)
      // and footer text are expected and would just make every BofA upload look broken.
      if (amountText(row, layout).trim() !== '') unreadable++;
      continue;
    }
    const description = cell(row, layout.description).trim().replace(/\s+/g, ' ') || '(no description)';
    raw.push({ id: `${fileIndex}:${r}`, date, description, value });
  }

  const warnings: string[] = [];
  const multiplier = resolveMultiplier(layout.sign, raw.map((x) => x.value), warnings);
  const transactions: Transaction[] = raw.map((x) => ({
    id: x.id,
    date: x.date,
    description: x.description,
    // `|| 0` turns -0 into 0 so zero rows serialize cleanly.
    amount: x.value * multiplier || 0,
    format: layout.format,
  }));

  if (unreadable > 0) warnings.push(`${unreadable} row${unreadable === 1 ? '' : 's'} had no readable date or amount and ${unreadable === 1 ? 'was' : 'were'} skipped.`);
  if (transactions.length === 0) warnings.push('No transactions found under the header row.');
  return { format: layout.format, transactions, skippedRows: skipped, warnings };
}
