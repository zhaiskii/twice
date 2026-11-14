/**
 * Owns: the analysis pipeline wiring — classify → recurring → findings → totals → needs.
 * Pure and synchronous; no rule imports JSON (the catalog is passed in).
 */
import { buildFindings, sortFindings } from './findings';
import { buildNeeds } from './needs';
import { classify } from './normalize';
import { detectRecurring } from './recurring';
import { computeTotals } from './totals';
import type { Analysis, Catalog, Profile, Transaction } from './types';

export function runAnalysis(transactions: Transaction[], profile: Profile, catalog: Catalog): Analysis {
  const recurring = detectRecurring(classify(transactions, catalog.merchants));
  const keyed = buildFindings(recurring, profile, catalog);
  return {
    recurring,
    findings: sortFindings(keyed.map((k) => k.finding)),
    totals: computeTotals(recurring, keyed),
    needs: buildNeeds(recurring, profile, catalog),
  };
}
