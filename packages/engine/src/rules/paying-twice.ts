/**
 * Owns: finding kind `paying_twice` — you pay directly for a service that a card,
 * phone plan or membership you already have includes (SPEC step 3).
 */
import { money, perPeriod, recentIds } from '../text';
import type { PerkRow } from '../types';
import type { KeyedFinding, RuleContext } from './context';

/** Evidence ids of the provider's own charge, or null when the user does not have the provider. */
function providerEvidence(perk: PerkRow, ctx: RuleContext): string[] | null {
  if (perk.detection === 'statement') {
    // Statement perks (Walmart+): we can SEE the provider's charge, so no quiz needed.
    const provider = perk.providerMerchantId ? ctx.byMerchant.get(perk.providerMerchantId) : undefined;
    return provider ? recentIds(provider) : null;
  }
  // DECISION(quiz-perks): cards and phone-plan tiers leave no monthly charge to detect, so the
  // perk only fires after the user says they have the provider. We never claim an unconfirmed perk.
  return ctx.profile.perkProviders?.includes(perk.provider.id) ? [] : null;
}

export function payingTwiceFindings(ctx: RuleContext): KeyedFinding[] {
  const out: KeyedFinding[] = [];
  for (const perk of ctx.catalog.perks) {
    const paid = ctx.byMerchant.get(perk.includesMerchantId);
    // A provider cannot be "paying twice" for itself (Walmart+ perk row pointing at Walmart+).
    if (!paid || perk.includesMerchantId === perk.providerMerchantId) continue;
    const providerIds = providerEvidence(perk, ctx);
    if (!providerIds) continue;

    // DECISION(perk-value): from types.ts — floor = price of the INCLUDED tier (perks are often the
    // ad tier), ceiling = what the user pays now. Cap the floor so low ≤ high even if the user
    // already pays less than the included tier's list price.
    const high = Math.round(paid.annualCost);
    const low = Math.min(Math.round(perk.includedTierMonthly * 12), high);
    const provider = perk.provider.name;
    const viaQuiz = perk.detection === 'quiz';

    out.push({
      merchantId: paid.merchantId,
      finding: {
        id: `paying_twice:${perk.provider.id}:${paid.merchantId}`,
        kind: 'paying_twice',
        title: `${paid.merchantName} is already included with ${provider}`,
        detail: `You pay ${perPeriod(paid)} for ${paid.merchantName}, but ${provider} already includes ${perk.includedTier} at no extra cost.`,
        annualSavings: { low, high },
        evidence: [...recentIds(paid), ...providerIds],
        rule: viaQuiz
          ? `${provider} includes ${perk.includedTier} (you told us you have ${provider}).`
          : `${provider} includes ${perk.includedTier}, and we see your ${provider} charge on this statement.`,
        sources: [{ label: `${provider}: what's included`, url: perk.url, checkedOn: perk.checkedOn }],
        kit: perk.kit.map((step) => ({ ...step })),
        confidence: 'high',
        assumptions: [
          perk.conditions,
          `Low estimate is the price of the included tier (${money(perk.includedTierMonthly)}/mo); high is what you pay today.`,
        ],
      },
    });
  }
  return out;
}
