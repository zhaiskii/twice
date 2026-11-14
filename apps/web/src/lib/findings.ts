/**
 * Presentation metadata for engine findings: group names, order and copy.
 * The engine decides WHAT was found; this file only decides how it is labeled.
 */
import type { Analysis, Finding, FindingKind } from '@twice/engine';

// DECISION(group-order): "Already included" first even when the phone switch is bigger —
// it is the product's original idea and the easiest win (activate a perk, cancel a
// duplicate). Price steps are last: they are evidence, not savings. Copy is the SPEC's.
export const KIND_ORDER: FindingKind[] = ['paying_twice', 'phone_switch', 'overlap', 'price_step'];

export const KIND_META: Record<FindingKind, { group: string; chip: string; blurb: string }> = {
  paying_twice: {
    group: 'Already included',
    chip: 'Already included',
    blurb: 'You pay for these directly, but a plan, card or membership you have already covers them.',
  },
  phone_switch: {
    group: 'Same network, less',
    chip: 'Same network',
    blurb: 'Same towers, same coverage, a smaller bill.',
  },
  overlap: {
    group: 'Two doing one job',
    chip: 'Overlap',
    blurb: 'Two services that do the same thing. Keep the one you use.',
  },
  price_step: {
    group: 'Price went up',
    chip: 'Price went up',
    blurb: 'Not savings on their own — the exact charge where each price changed.',
  },
};

export interface FindingGroup {
  kind: FindingKind;
  findings: Finding[];
}

export function groupFindings(findings: Finding[]): FindingGroup[] {
  return KIND_ORDER.map((kind) => ({ kind, findings: findings.filter((f) => f.kind === kind) })).filter(
    (g) => g.findings.length > 0,
  );
}

/** A finding the user can act on for money (price steps are informational). */
export function isSaving(f: Finding): boolean {
  return f.kind !== 'price_step' && f.annualSavings.high > 0;
}

export function hasSavings(analysis: Analysis): boolean {
  return analysis.findings.some(isSaving);
}
