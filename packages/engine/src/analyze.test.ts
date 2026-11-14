import { describe, expect, it } from 'vitest';
import { analyze, catalog, parseStatement } from './index';
import { TINY_CATALOG, series, tx } from './test-utils';

describe('totals', () => {
  it('counts a merchant once even when two findings mention it (no double count)', () => {
    // Netflix is flagged by paying_twice (T-Mobile perk, confirmed by quiz) AND overlap (3 streaming services).
    const txs = [...series('NETFLIX.COM', 9.99, '2026-01-05', 6), ...series('HULU', 11.99, '2026-01-06', 6), ...series('HBO MAX', 16.99, '2026-01-07', 6)];
    const a = analyze(txs, { perkProviders: ['tmobile_experience_more'] }, TINY_CATALOG);
    const twice = a.findings.find((f) => f.kind === 'paying_twice');
    const overlap = a.findings.find((f) => f.kind === 'overlap');
    // paying_twice on Netflix: low = min(7.99×12, 9.99×12) = 96, high = 120. overlap: cheapest = Netflix → 120.
    expect(twice?.annualSavings).toEqual({ low: 96, high: 120 });
    expect(overlap?.annualSavings).toEqual({ low: 120, high: 120 });
    // Naive sum would be 216–240. Per merchant we keep the max on each side: 120–120.
    expect(a.totals.annualLow).toBe(120);
    expect(a.totals.annualHigh).toBe(120);
  });

  it('sums different merchants', () => {
    const txs = [...series('SPOTIFY USA', 11.99, '2026-01-05', 6), ...series('APPLE MUSIC', 10.99, '2026-01-09', 6), ...series('VERIZON WIRELESS', 165, '2026-01-03', 6)];
    const a = analyze(txs, { phoneLines: 2 }, TINY_CATALOG);
    expect(a.totals.annualHigh).toBe(132 + 1500);
    expect(a.totals.annualLow).toBe(132 + 900);
  });

  it('recurringAnnual is the sum of annualCost over all series', () => {
    const a = analyze([...series('SPOTIFY USA', 10, '2026-01-05', 3), ...series('NETFLIX.COM', 20, '2026-01-06', 3)], {}, TINY_CATALOG);
    expect(a.totals.recurringAnnual).toBe(360);
  });

  it('is all zeros for an empty statement', () => {
    expect(analyze([], {}, TINY_CATALOG)).toEqual({ recurring: [], findings: [], totals: { annualLow: 0, annualHigh: 0, recurringAnnual: 0 }, needs: [] });
  });
});

describe('needs (adaptive quiz)', () => {
  const verizonBill = series('VERIZON WIRELESS', 165, '2026-01-03', 6);

  it('asks for phone lines when a big-three bill exists, citing the bill', () => {
    const [q] = analyze(verizonBill, {}, TINY_CATALOG).needs;
    expect(q).toMatchObject({ id: 'phoneLines', kind: 'number' });
    expect(q?.reason).toContain('Your Verizon bill is $165/mo');
  });

  it('never asks about phones without a wireless bill, or for an MVNO, or once answered', () => {
    expect(analyze(series('SPOTIFY USA', 11.99, '2026-01-05', 6), {}, TINY_CATALOG).needs.some((q) => q.id === 'phoneLines')).toBe(false);
    expect(analyze(series('MINT MOBILE', 30, '2026-01-05', 6), {}, TINY_CATALOG).needs).toEqual([]);
    expect(analyze(verizonBill, { phoneLines: 2 }, TINY_CATALOG).needs).toEqual([]);
  });

  it('asks which cards / plans they have only for quiz perks whose service they pay for', () => {
    const txs = [...series('NETFLIX.COM', 17.99, '2026-01-05', 6), ...series('TMOBILE*AUTO PAY', 150, '2026-01-02', 6)];
    const q = analyze(txs, { phoneLines: 3 }, TINY_CATALOG).needs.find((n) => n.id === 'perkProviders');
    expect(q?.kind).toBe('multi');
    expect(q?.options).toEqual([{ value: 'tmobile_experience_more', label: 'T-Mobile Experience More' }]);
    expect(q?.reason).toContain('Netflix ($17.99/mo)');
  });

  it('does not ask a T-Mobile plan question of someone on Verizon', () => {
    const txs = [...series('NETFLIX.COM', 17.99, '2026-01-05', 6), ...verizonBill];
    expect(analyze(txs, { phoneLines: 2 }, TINY_CATALOG).needs).toEqual([]);
  });

  it('lists card perks (no carrier) whenever the included service is recurring', () => {
    const q = analyze(series('DOORDASH DASHPASS', 9.99, '2026-01-05', 6), {}, TINY_CATALOG).needs[0];
    expect(q?.options).toEqual([{ value: 'chase_sapphire_preferred', label: 'Chase Sapphire Preferred' }]);
  });

  it('stops asking once perkProviders has been answered, even with an empty list', () => {
    expect(analyze(series('DOORDASH DASHPASS', 9.99, '2026-01-05', 6), { perkProviders: [] }, TINY_CATALOG).needs).toEqual([]);
  });
});

describe('editing a transaction re-runs the analysis (what the UI statement table does)', () => {
  const base = parseStatement(['Date,Description,Card Member,Account #,Amount', ...Array.from({ length: 6 }, (_, i) => `0${i + 1}/05/2026,SPOTIFY USA,A,-1,11.99`), ...Array.from({ length: 6 }, (_, i) => `0${i + 1}/09/2026,APPLE MUSIC,A,-1,10.99`)].join('\n')).transactions;

  it('changing an amount changes the savings', () => {
    const before = analyze(base, {}, TINY_CATALOG);
    expect(before.totals.annualHigh).toBe(132);
    // The user corrects every Apple Music charge to $4.99.
    const edited = base.map((t) => (t.description === 'APPLE MUSIC' ? { ...t, amount: 4.99 } : t));
    expect(analyze(edited, {}, TINY_CATALOG).totals.annualHigh).toBe(60);
  });

  it('editing a description to something else removes the finding; deleting rows removes the series', () => {
    const renamed = base.map((t) => (t.description === 'APPLE MUSIC' ? { ...t, description: 'LOCAL RADIO CLUB' } : t));
    expect(analyze(renamed, {}, TINY_CATALOG).findings.some((f) => f.kind === 'overlap')).toBe(false);
    expect(analyze(base.filter((t) => t.description !== 'SPOTIFY USA'), {}, TINY_CATALOG).findings).toEqual([]);
  });

  it('adding a row can create a series', () => {
    const one = [tx('2026-01-05', 'HULU', 9.99)];
    expect(analyze(one, {}, TINY_CATALOG).recurring).toEqual([]);
    expect(analyze([...one, tx('2026-02-04', 'HULU', 9.99)], {}, TINY_CATALOG).recurring).toHaveLength(1);
  });

  it('does not mutate its input and is deterministic', () => {
    const copy = JSON.stringify(base);
    const a = analyze(base, {}, TINY_CATALOG);
    expect(JSON.stringify(base)).toBe(copy);
    expect(analyze(base, {}, TINY_CATALOG)).toEqual(a);
  });
});

describe('performance (analyze reruns on every keystroke)', () => {
  const merchants = ['NETFLIX.COM', 'SPOTIFY USA', 'VERIZON WIRELESS', 'DOORDASH DASHPASS', 'WALMART+ MEMBERSHIP', 'APPLE.COM/BILL ICLOUD', 'GOOGLE *Google One'];
  const noise = ['H-E-B #482 AUSTIN TX', "TRADER JOE'S #123", 'SQ *EPIC ESPRESSO AUSTIN TX', 'AMZN Mktp US*2K4AB3X', 'UBER *TRIP HELP.UBER.COM', 'SHELL OIL 57444212345', 'CHIPOTLE 2345', 'TARGET 00012345'];
  // 1,000 transactions over ~3 years: 7 subscriptions × 36 months + noise, deterministic.
  const transactions = [
    ...merchants.flatMap((m) => series(m, 12.99, '2023-11-03', 36)),
    ...Array.from({ length: 748 }, (_, i) => tx(`2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`, noise[i % noise.length]!, 5 + ((i * 37) % 90))),
  ];

  it('has 1,000 rows', () => expect(transactions).toHaveLength(1000));

  it('analyze() on 1,000 transactions takes well under 16 ms (median of 30 runs, bundled catalog)', () => {
    analyze(transactions, {}, catalog); // warm-up: JIT + regex compile + memo, like the second keystroke
    const times: number[] = [];
    for (let i = 0; i < 30; i++) {
      // A fresh array each run so a result cache could not hide the cost. Edit one description to defeat the memo too.
      const edited = transactions.map((t, j) => (j === 0 ? { ...t, description: `EDIT ${i}` } : t));
      const start = performance.now();
      analyze(edited, { phoneLines: 2 }, catalog);
      times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    const median = times[15]!;
    expect(median).toBeLessThan(16);
  });

  it('a cold first run (no warm memo) still fits a generous budget', () => {
    const start = performance.now();
    analyze(transactions, {}, { ...catalog, merchants: [...catalog.merchants] });
    expect(performance.now() - start).toBeLessThan(100);
  });
});
