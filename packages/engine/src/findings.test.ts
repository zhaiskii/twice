import { describe, expect, it } from 'vitest';
import { analyze } from './index';
import { TINY_CATALOG, series, tx } from './test-utils';
import type { Catalog, Finding } from './types';

const run = (txs: ReturnType<typeof tx>[], profile = {}, catalog: Catalog = TINY_CATALOG) => analyze(txs, profile, catalog);
const byKind = (findings: Finding[], kind: Finding['kind']) => findings.filter((f) => f.kind === kind);

describe('paying_twice', () => {
  const walmartAndPeacock = [...series('WALMART+ MEMBERSHIP', 12.95, '2026-01-03', 6), ...series('PEACOCK PREMIUM', 10.99, '2026-01-12', 6)];

  it('statement perk: fires when both the provider and the included service are recurring', () => {
    const [f] = byKind(run(walmartAndPeacock).findings, 'paying_twice');
    expect(f).toMatchObject({
      id: 'paying_twice:walmart_plus:peacock',
      title: 'Peacock is already included with Walmart+',
      // low = included tier ($7.99 × 12), high = what she pays ($10.99 × 12)
      annualSavings: { low: 96, high: 132 },
      confidence: 'high',
    });
    expect(f?.sources).toEqual([{ label: "Walmart+: what's included", url: 'https://example.com/w', checkedOn: '2026-11-01' }]);
    expect(f?.kit).toEqual(TINY_CATALOG.perks[0]?.kit);
    expect(f?.assumptions).toContain('Choose Peacock or Paramount+ in your Walmart+ account.');
    // Evidence cites both the Peacock charges and the Walmart+ charges.
    expect(f?.evidence).toHaveLength(6);
  });

  it('does not fire without the provider (Peacock alone is not "included" in anything)', () => {
    expect(byKind(run(series('PEACOCK PREMIUM', 10.99, '2026-01-12', 6)).findings, 'paying_twice')).toEqual([]);
  });

  it('quiz perk: silent until the user confirms the provider', () => {
    const netflix = series('NETFLIX.COM', 17.99, '2026-01-05', 6);
    expect(byKind(run(netflix).findings, 'paying_twice')).toEqual([]);
    const [f] = byKind(run(netflix, { perkProviders: ['tmobile_experience_more'] }).findings, 'paying_twice');
    expect(f?.id).toBe('paying_twice:tmobile_experience_more:netflix');
    expect(f?.annualSavings).toEqual({ low: 96, high: 216 });
    expect(f?.rule).toMatch(/you told us/);
  });

  it('caps low at high when the user already pays less than the included tier', () => {
    const cheap = series('NETFLIX.COM', 5.99, '2026-01-05', 6);
    const [f] = byKind(run(cheap, { perkProviders: ['tmobile_experience_more'] }).findings, 'paying_twice');
    expect(f?.annualSavings).toEqual({ low: 72, high: 72 });
  });
});

describe('overlap', () => {
  it('two music services: saving is the cheaper one, low = high', () => {
    const [f] = byKind(run([...series('SPOTIFY USA', 11.99, '2026-01-05', 6), ...series('APPLE MUSIC', 10.99, '2026-01-09', 6)]).findings, 'overlap');
    expect(f).toMatchObject({ id: 'overlap:music', title: 'Apple Music and Spotify do the same job', annualSavings: { low: 132, high: 132 } });
    expect(f?.kit.length).toBeGreaterThanOrEqual(2);
    expect(f?.evidence).toHaveLength(6); // last 3 charges of each
  });

  it('two video-streaming services are normal; three are an overlap', () => {
    const two = [...series('NETFLIX.COM', 15.49, '2026-01-05', 4), ...series('HULU', 9.99, '2026-01-06', 4)];
    expect(byKind(run(two).findings, 'overlap')).toEqual([]);
    const three = [...two, ...series('HBO MAX', 16.99, '2026-01-07', 4)];
    const [f] = byKind(run(three).findings, 'overlap');
    expect(f?.annualSavings.high).toBe(120); // Hulu $9.99 × 12 = 119.88
  });

  it('services in different categories are not an overlap', () => {
    expect(byKind(run([...series('SPOTIFY USA', 11.99, '2026-01-05', 4), ...series('NETFLIX.COM', 15.49, '2026-01-06', 4)]).findings, 'overlap')).toEqual([]);
  });
});

describe('phone_switch', () => {
  const verizon = series('VERIZON WIRELESS', 165, '2026-01-03', 6);

  it('same-network alternatives, cheapest first, never above the current bill', () => {
    const [f] = byKind(run(verizon, { phoneLines: 2 }).findings, 'phone_switch');
    // 2 lines: Visible total $40 (explicit), Total Wireless 2×30 = 60, Straight Talk 2×45 = 90; $240 plan is dropped.
    expect(f?.alternatives?.map((a) => [a.planId, a.monthlyTotal])).toEqual([['vz_a', 40], ['vz_b', 60], ['vz_c', 90]]);
    // high = (165 − 40) × 12; low = (165 − 90) × 12
    expect(f?.annualSavings).toEqual({ low: 900, high: 1500 });
    expect(f?.confidence).toBe('high');
    expect(f?.id).toBe('phone_switch:verizon');
  });

  it('estimates lines from the bill when unknown and says so (confidence medium)', () => {
    const [f] = byKind(run(verizon).findings, 'phone_switch');
    expect(f?.confidence).toBe('medium');
    expect(f?.assumptions[0]).toMatch(/estimated 2 lines/);
    expect(f?.alternatives?.[0]?.monthlyTotal).toBe(40);
  });

  it('kit = port-out steps + sign-up step + "keep the old line until the number ports"', () => {
    const [f] = byKind(run(verizon, { phoneLines: 2 }).findings, 'phone_switch');
    expect(f?.kit.map((s) => s.title)).toEqual(['Get your transfer PIN', 'Order the eSIM or SIM for Visible', 'Keep your Verizon line until the number ports']);
    expect(f?.kit[1]?.body).toContain('https://example.com/visible');
  });

  it('puts carrier warnings, the paid-off assumption and the tax caveat in assumptions', () => {
    const [f] = byKind(run(verizon, { phoneLines: 2 }).findings, 'phone_switch');
    expect(f?.assumptions).toContain('Verizon locks new phones for 60 days.');
    expect(f?.assumptions.some((a) => /paid off/.test(a))).toBe(true);
    expect(f?.assumptions.some((a) => /before taxes/.test(a))).toBe(true);
  });

  it('cites the carrier and every recommended plan as a dated source', () => {
    const [f] = byKind(run(verizon, { phoneLines: 2 }).findings, 'phone_switch');
    expect(f?.sources.map((s) => s.url)).toEqual(['https://example.com/vz', 'https://example.com/visible', 'https://example.com/total', 'https://example.com/st']);
    expect(f?.sources.every((s) => s.checkedOn === '2026-11-01')).toBe(true);
  });

  it('skips MVNO customers (not big three) and bills already below every alternative', () => {
    expect(byKind(run(series('MINT MOBILE', 30, '2026-01-03', 6), { phoneLines: 1 }).findings, 'phone_switch')).toEqual([]);
    expect(byKind(run(series('VERIZON WIRELESS', 20, '2026-01-03', 6), { phoneLines: 1 }).findings, 'phone_switch')).toEqual([]);
  });

  it('skips when the catalog has no plan on that network', () => {
    const noPlans = { ...TINY_CATALOG, plans: [] };
    expect(run(verizon, {}, noPlans).findings).toEqual([]);
  });

  it('shortens to the plans that beat the bill when fewer than three do', () => {
    const [f] = byKind(run(series('VERIZON WIRELESS', 70, '2026-01-03', 6), { phoneLines: 2 }).findings, 'phone_switch');
    expect(f?.alternatives?.map((a) => a.planId)).toEqual(['vz_a', 'vz_b']);
    expect(f?.annualSavings).toEqual({ low: 120, high: 360 });
  });
});

describe('price_step', () => {
  const peacock = series('PEACOCK PREMIUM', (i) => (i < 4 ? 7.99 : 10.99), '2026-01-05', 7);

  it('one finding per series, savings {0,0}, annualIncrease from pre-step to latest', () => {
    const [f] = byKind(run(peacock).findings, 'price_step');
    expect(f).toMatchObject({ id: 'price_step:peacock', annualSavings: { low: 0, high: 0 }, annualIncrease: 36, kit: [] });
    expect(f?.detail).toContain('$7.99 to $10.99');
    expect(f?.detail).toContain('May 5, 2026');
    expect(f?.evidence).toEqual(['PEACOCK PREMIUM#3', 'PEACOCK PREMIUM#4']);
  });

  it('a price DROP is not a finding', () => {
    expect(byKind(run(series('PEACOCK PREMIUM', (i) => (i < 4 ? 10.99 : 7.99), '2026-01-05', 7)).findings, 'price_step')).toEqual([]);
  });

  it('is excluded from the savings totals', () => {
    expect(run(peacock).totals).toMatchObject({ annualLow: 0, annualHigh: 0 });
  });
});

describe('ordering', () => {
  it('sorts by annualSavings.high desc with price_step last', () => {
    const txs = [
      ...series('VERIZON WIRELESS', 165, '2026-01-03', 6),
      ...series('SPOTIFY USA', 11.99, '2026-01-05', 6),
      ...series('APPLE MUSIC', 10.99, '2026-01-09', 6),
      ...series('NETFLIX.COM', (i) => (i < 3 ? 15.49 : 17.99), '2026-01-11', 6),
    ];
    const kinds = run(txs, { phoneLines: 2 }).findings.map((f) => f.kind);
    expect(kinds).toEqual(['phone_switch', 'overlap', 'price_step']);
  });
});
