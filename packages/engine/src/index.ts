/**
 * Public API of @twice/engine. apps/web imports ONLY from here.
 *
 * DECISION(pure-engine): the engine is synchronous, pure and network-free.
 * It runs in the browser on every edit of the statement table, so the raw
 * statement never leaves the device (the privacy pitch) and every result is
 * reproducible in a unit test (the "not hardcoded" pitch).
 *
 * AGENT: the bodies below are STUBS so the web app compiles while the engine
 * is being built. Replace them; keep the signatures (they are the contract
 * with apps/web — see docs/SPEC.md).
 */
import type { Analysis, Catalog, ParseResult, Persona, Profile, Transaction } from './types';
import merchants from '../data/merchants.json';
import carriers from '../data/carriers.json';
import plans from '../data/plans.json';
import perks from '../data/perks.json';
import personasJson from '../fixtures/personas.json';

export type * from './types';

/** Bundled, sourced catalog. Tests inject their own small catalogs instead. */
export const catalog = { merchants, carriers, plans, perks } as Catalog;

/** Sample statements for the no-login demo. CSV text is loaded by the web app via Vite `?raw`. */
export const personas = personasJson as Persona[];

/** Parse one bank CSV export. Never throws; see ParseResult.warnings. */
export function parseStatement(csv: string, fileIndex = 0): ParseResult {
  void csv;
  void fileIndex;
  return { format: 'generic', transactions: [], skippedRows: 0, warnings: ['engine not implemented yet'] };
}

/** Full pipeline: normalize → recurring → findings → totals → needs. Pure and fast (call on every edit). */
export function analyze(transactions: Transaction[], profile: Profile = {}, cat: Catalog = catalog): Analysis {
  void transactions;
  void profile;
  void cat;
  return { recurring: [], findings: [], totals: { annualLow: 0, annualHigh: 0, recurringAnnual: 0 }, needs: [] };
}
