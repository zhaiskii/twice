/**
 * Owns: the shared input/output shapes of the finding rules.
 * Rules receive the Catalog as an argument (never import JSON) so tests can pass tiny inline catalogs.
 */
import type { Catalog, Finding, Profile, RecurringCharge } from '../types';

export interface RuleContext {
  recurring: RecurringCharge[];
  /** Recurring series by merchantId, for O(1) perk / provider lookups. */
  byMerchant: Map<string, RecurringCharge>;
  profile: Profile;
  catalog: Catalog;
}

/** A finding plus the merchant whose saving it claims — totals.ts uses it to avoid double counting. */
export interface KeyedFinding {
  finding: Finding;
  /** null for findings that claim no savings (price_step). */
  merchantId: string | null;
}
