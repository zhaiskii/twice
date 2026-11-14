/**
 * Owns: parsing ONE CSV cell into a date or an amount. Pure string → value,
 * tolerant of the formats US banks actually export; returns null instead of throwing.
 */
import { daysInMonth } from './dates';

const pad = (n: number) => String(n).padStart(2, '0');

function validIso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/**
 * Accepts yyyy-mm-dd (optionally with a time), yyyy/mm/dd, mm/dd/yyyy, m/d/yy.
 * DECISION(us-dates): slash dates are read as MONTH/DAY/year. This is a US-bank product;
 * guessing day-first would silently corrupt every ambiguous date (03/04). Revisit if we
 * add non-US banks — then detect day-first from any cell where the first number is > 12.
 * DECISION(two-digit-year): yy → 20yy. Statements are recent; no bank exports 19xx dates.
 */
export function parseDate(raw: string | undefined): string | null {
  const s = (raw ?? '').trim().replace(/^"|"$/g, '');
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ].*)?$/.exec(s);
  if (m) return validIso(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(s);
  if (m) {
    const year = m[3]!.length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return validIso(year, Number(m[1]), Number(m[2]));
  }
  return null;
}

/**
 * "$1,234.56" → 1234.56, "(12.00)" → -12, "-12.00" → -12, "12.00-" → -12.
 * Empty or non-numeric → null (the caller counts the row as skipped).
 */
export function parseAmount(raw: string | undefined): number | null {
  const s = (raw ?? '').trim();
  if (s === '') return null;
  const negative = /^\(.*\)$/.test(s) || /^[-−]/.test(s) || /[-−]$/.test(s) || /\bCR$/i.test(s);
  const digits = s.replace(/[$,\s()+−-]|CR$/gi, '');
  if (!/^(\d+\.?\d*|\.\d+)$/.test(digits)) return null;
  // DECISION(cents): round to cents so float noise from "$0.1" style cells never leaks into sums.
  const value = Math.round(Number(digits) * 100) / 100;
  return negative ? -value : value;
}
