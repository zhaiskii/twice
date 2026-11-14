/**
 * Owns: calendar arithmetic on ISO `yyyy-mm-dd` strings, with no `Date` objects
 * (no timezone surprises, no Date.now — engine purity, AGENTS.md rule 3) and
 * no allocation in the hot path (analyze() reruns on every keystroke).
 */

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Days since 1970-01-01 (proleptic Gregorian). NaN when `iso` is not a valid yyyy-mm-dd. */
export function dayNumber(iso: string): number {
  const m = ISO.exec(iso);
  if (!m) return NaN;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return NaN;
  // Howard Hinnant's days_from_civil, shifting the year to start in March.
  const y = month <= 2 ? Number(m[1]) - 1 : Number(m[1]);
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** Inverse of dayNumber. */
export function isoFromDayNumber(z0: number): string {
  const z = z0 + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  const year = yoe + era * 400 + (month <= 2 ? 1 : 0);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function addDays(iso: string, days: number): string {
  const n = dayNumber(iso);
  return Number.isNaN(n) ? iso : isoFromDayNumber(n + days);
}

export function daysInMonth(year: number, month: number): number {
  return [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-08-12" → "Aug 12, 2026" (plain English for finding text). */
export function prettyDate(iso: string): string {
  const m = ISO.exec(iso);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1] ?? m[2]} ${Number(m[3])}, ${m[1]}`;
}
