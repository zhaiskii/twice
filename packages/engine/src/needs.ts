/**
 * Owns: adaptive quiz questions (SPEC step 5). The engine decides which questions
 * matter from what it found, so a user with no wireless bill is never asked about phones.
 * Every `reason` cites the user's own numbers.
 */
import { joinNames, money, perPeriod } from './text';
import type { Catalog, PerkRow, Profile, Question, RecurringCharge } from './types';

function phoneLinesQuestion(recurring: RecurringCharge[], profile: Profile, catalog: Catalog): Question | null {
  if (profile.phoneLines !== undefined) return null;
  for (const series of recurring) {
    if (series.cadence !== 'monthly') continue;
    const carrierId = catalog.merchants.find((m) => m.id === series.merchantId)?.carrierId;
    const carrier = carrierId ? catalog.carriers.find((c) => c.id === carrierId) : undefined;
    if (!carrier?.isBigThree) continue;
    return {
      id: 'phoneLines',
      prompt: 'How many phone lines are on this bill?',
      reason: `Your ${carrier.name} bill is ${money(series.currentAmount)}/mo. Prices on other plans depend on the number of lines, and we would rather not guess.`,
      kind: 'number',
    };
  }
  return null;
}

/** Wireless carrier ids present in the recurring list. */
function detectedCarriers(recurring: RecurringCharge[], catalog: Catalog): Set<string> {
  const ids = new Set<string>();
  for (const r of recurring) {
    const carrierId = catalog.merchants.find((m) => m.id === r.merchantId)?.carrierId;
    if (carrierId) ids.add(carrierId);
  }
  return ids;
}

function perkProvidersQuestion(recurring: RecurringCharge[], profile: Profile, catalog: Catalog): Question | null {
  // DECISION(answered): once the user has answered (even with an empty list) we never re-ask.
  if (profile.perkProviders !== undefined) return null;
  const byMerchant = new Map(recurring.map((r) => [r.merchantId, r]));
  const carriers = detectedCarriers(recurring, catalog);

  // DECISION(ask-only-if-useful): a quiz perk is only worth asking about when the service it
  // includes is something the user pays for today — otherwise no answer could change a finding.
  // Phone-plan perks additionally require the user's detected carrier to match.
  const relevant = catalog.perks.filter(
    (p: PerkRow) =>
      p.detection === 'quiz' &&
      byMerchant.has(p.includesMerchantId) &&
      (p.provider.kind !== 'phone_plan' || (p.carrierId !== undefined && carriers.has(p.carrierId))),
  );
  if (relevant.length === 0) return null;

  const options = new Map<string, string>();
  for (const p of relevant) options.set(p.provider.id, p.provider.name);
  const paid = [...new Map(relevant.map((p) => [p.includesMerchantId, byMerchant.get(p.includesMerchantId)!])).values()];

  return {
    id: 'perkProviders',
    prompt: 'Which of these do you have?',
    reason: `You pay for ${joinNames(paid.map((r) => `${r.merchantName} (${perPeriod(r)})`))}. Some cards and phone plans include these for free.`,
    kind: 'multi',
    options: [...options].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export function buildNeeds(recurring: RecurringCharge[], profile: Profile, catalog: Catalog): Question[] {
  return [phoneLinesQuestion(recurring, profile, catalog), perkProvidersQuestion(recurring, profile, catalog)].filter(
    (q): q is Question => q !== null,
  );
}
