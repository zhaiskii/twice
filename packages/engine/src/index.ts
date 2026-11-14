/**
 * Public API of @twice/engine. apps/web imports ONLY from here.
 *
 * DECISION(pure-engine): the engine is synchronous, pure and network-free.
 * It runs in the browser on every edit of the statement table, so the raw
 * statement never leaves the device (the privacy pitch) and every result is
 * reproducible in a unit test (the "not hardcoded" pitch).
 *
 * AGENT: keep these signatures stable (the contract with apps/web — see docs/SPEC.md).
 * The work lives in csv → formats (parse) and normalize → recurring → findings → totals/needs
 * (analyze), wired together in analyze.ts.
 */
import { runAnalysis } from './analyze';
import { parseBankCsv } from './formats';
import type { Analysis, Catalog, ParseResult, Persona, Profile, Transaction } from './types';
import merchants from '../data/merchants.json';
import carriers from '../data/carriers.json';
import plans from '../data/plans.json';
import perks from '../data/perks.json';
import personasJson from '../fixtures/personas.json';

export type * from './types';

// DECISION(json-cast): JSON imports widen string literals (category: string), so the bundled data
// cannot be checked against the union types by `as Catalog` directly. data.test.ts validates the
// real shape at test time instead (ids, categories, urls, checkedOn).
/** Bundled, sourced catalog. Tests inject their own small catalogs instead. */
export const catalog = { merchants, carriers, plans, perks } as unknown as Catalog;

/** Sample statements for the no-login demo. CSV text is loaded by the web app via Vite `?raw`. */
export const personas = personasJson as Persona[];

/** Parse one bank CSV export. Never throws; see ParseResult.warnings. */
export function parseStatement(csv: string, fileIndex = 0): ParseResult {
  return parseBankCsv(csv, fileIndex);
}

/** Full pipeline: normalize → recurring → findings → totals → needs. Pure and fast (call on every edit). */
export function analyze(transactions: Transaction[], profile: Profile = {}, cat: Catalog = catalog): Analysis {
  return runAnalysis(transactions, profile, cat);
}
