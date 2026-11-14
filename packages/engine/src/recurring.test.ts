import { describe, expect, it } from 'vitest';
import { classify } from './normalize';
import { detectRecurring } from './recurring';
import { MERCHANTS, series, tx } from './test-utils';

const detect = (...groups: ReturnType<typeof tx>[][]) => detectRecurring(classify(groups.flat(), MERCHANTS));

describe('monthly detection', () => {
  it('finds a catalogued merchant with two charges ~30 days apart', () => {
    const [r] = detect(series('NETFLIX.COM', 15.49, '2026-01-05', 2));
    expect(r).toMatchObject({ merchantId: 'netflix', cadence: 'monthly', currentAmount: 15.49, annualCost: 185.88, firstSeen: '2026-01-05', lastSeen: '2026-02-04' });
    expect(r?.transactionIds).toHaveLength(2);
  });

  it('ignores a single catalogued charge', () => {
    expect(detect(series('NETFLIX.COM', 15.49, '2026-01-05', 1))).toEqual([]);
  });

  it('tolerates drift in the billing day (28–31 day months)', () => {
    const days = ['2026-01-31', '2026-03-02', '2026-04-01', '2026-05-02', '2026-06-01'];
    const charges = days.map((d, i) => tx(d, 'SPOTIFY USA', 11.99, `s${i}`));
    expect(detect(charges)[0]?.transactionIds).toHaveLength(5);
  });

  it('tolerates ONE missed month (gap of ~2 months) but not two', () => {
    const one = [tx('2026-01-05', 'HULU', 9.99, 'a'), tx('2026-02-04', 'HULU', 9.99, 'b'), tx('2026-04-05', 'HULU', 9.99, 'c'), tx('2026-05-05', 'HULU', 9.99, 'd')];
    expect(detect(one)[0]?.transactionIds).toEqual(['a', 'b', 'c', 'd']);

    const two = [tx('2026-01-05', 'HULU', 9.99, 'a'), tx('2026-02-04', 'HULU', 9.99, 'b'), tx('2026-04-05', 'HULU', 9.99, 'c'), tx('2026-06-04', 'HULU', 9.99, 'd')];
    // Second skip breaks the run; the latest run (c, d) has < required length only if gap fails — here the best run is a,b,c.
    expect(detect(two)[0]?.transactionIds).toEqual(['a', 'b', 'c']);
  });

  it('ignores an extra charge inside the same cycle (a prorated add-on)', () => {
    const charges = [...series('NETFLIX.COM', 15.49, '2026-01-05', 4), tx('2026-02-12', 'NETFLIX.COM', 3.0, 'extra')];
    const r = detect(charges)[0];
    expect(r?.transactionIds).toHaveLength(4);
    expect(r?.transactionIds).not.toContain('extra');
  });

  it('never lets refunds or payments start or join a series', () => {
    const refunds = series('NETFLIX.COM', -15.49, '2026-01-05', 4);
    expect(detect(refunds)).toEqual([]);
    const mixed = [...series('NETFLIX.COM', 15.49, '2026-01-05', 3), tx('2026-02-20', 'NETFLIX.COM', -15.49, 'refund')];
    expect(detect(mixed)[0]?.transactionIds).not.toContain('refund');
  });

  it('survives garbage dates and amounts from a half-typed UI edit', () => {
    const charges = [...series('NETFLIX.COM', 15.49, '2026-01-05', 3), tx('', 'NETFLIX.COM', 15.49), tx('2026-13-40', 'NETFLIX.COM', 15.49), tx('2026-04-05', 'NETFLIX.COM', Number.NaN)];
    expect(detect(charges)[0]?.transactionIds).toHaveLength(3);
  });
});

describe('uncatalogued merchants', () => {
  it('need ≥3 charges within ±5% of each other', () => {
    expect(detect(series('ACME GYM', 29.99, '2026-01-05', 2))).toEqual([]);
    const r = detect(series('ACME GYM', (i) => 29.99 + i * 0.5, '2026-01-05', 3))[0];
    expect(r?.merchantId).toBe('unknown:ACME GYM');
    expect(r?.category).toBe('other');
  });

  it('are rejected when amounts vary more than 5% (a store, not a subscription)', () => {
    expect(detect(series('LOCAL DINER', (i) => [20, 35, 48, 22][i] ?? 20, '2026-01-05', 4))).toEqual([]);
  });

  it('are rejected when the series is a minority of a merchant\'s charges', () => {
    const noise = Array.from({ length: 9 }, (_, i) => tx(`2026-0${(i % 6) + 1}-${10 + i}`, 'CORNER STORE', 7.5 + (i % 2) * 40, `n${i}`));
    expect(detect(series('CORNER STORE', 12, '2026-01-02', 3), noise)).toEqual([]);
  });

  it('ignore money movement (rent, Zelle, card payments)', () => {
    expect(detect(series('Zelle payment to LANDLORD', 1450, '2026-01-01', 6), series('CHASE CREDIT CRD AUTOPAY', 300, '2026-01-20', 6))).toEqual([]);
  });
});

describe('wireless amount guard', () => {
  it('a one-off phone purchase never pairs with the monthly bill', () => {
    expect(detect([tx('2026-01-05', 'T-MOBILE', 165, 'bill'), tx('2026-02-04', 'T-MOBILE', 899, 'phone')])).toEqual([]);
  });
});

describe('weekly and annual', () => {
  it('weekly needs 4 charges 6–8 days apart', () => {
    expect(detect(series('ACME BOX', 12, '2026-01-05', 3, 7))).toEqual([]);
    const r = detect(series('ACME BOX', 12, '2026-01-05', 4, 7))[0];
    expect(r).toMatchObject({ cadence: 'weekly', annualCost: 624 });
  });

  it('annual: two charges 350–380 days apart', () => {
    const r = detect([tx('2025-03-01', 'ADOBE', 119.88, 'a'), tx('2026-03-01', 'ADOBE', 119.88, 'b')])[0];
    expect(r).toMatchObject({ cadence: 'annual', annualCost: 119.88 });
  });

  it('annual: one catalogued membership charge of $50+ counts (Amazon Prime $139)', () => {
    const r = detect([tx('2026-02-14', 'AMAZON PRIME*2K4AB3X', 139, 'prime')])[0];
    expect(r).toMatchObject({ merchantId: 'amazon_prime', cadence: 'annual', annualCost: 139 });
  });

  it('a single membership charge under $50 does not', () => {
    expect(detect([tx('2026-02-14', 'AMAZON PRIME*2K4AB3X', 14.99)])).toEqual([]);
  });
});

describe('price steps', () => {
  it('detects a persistent step ≥ $0.50 and ≥ 3%', () => {
    const r = detect(series('PEACOCK PREMIUM', (i) => (i < 4 ? 7.99 : 10.99), '2026-01-05', 7))[0];
    expect(r?.priceSteps).toEqual([{ date: '2026-05-05', from: 7.99, to: 10.99, transactionId: 'PEACOCK PREMIUM#4' }]);
    expect(r?.currentAmount).toBe(10.99);
  });

  it('a step on the very latest charge counts (it persists to the latest)', () => {
    const r = detect(series('PEACOCK PREMIUM', (i) => (i < 3 ? 7.99 : 10.99), '2026-01-05', 4))[0];
    expect(r?.priceSteps).toHaveLength(1);
  });

  it('ignores a one-month blip that reverts', () => {
    const r = detect(series('PEACOCK PREMIUM', (i) => (i === 3 ? 14.99 : 7.99), '2026-01-05', 7))[0];
    expect(r?.priceSteps).toEqual([]);
  });

  it('ignores wobble under $0.50 or under 3%', () => {
    expect(detect(series('SPOTIFY USA', (i) => (i < 3 ? 11.99 : 12.3), '2026-01-05', 6))[0]?.priceSteps).toEqual([]); // $0.31
    expect(detect(series('VERIZON WIRELESS', (i) => (i < 3 ? 165 : 169), '2026-01-05', 6))[0]?.priceSteps).toEqual([]); // 2.4%
  });

  it('reports two steps when the price rose twice and held', () => {
    const r = detect(series('NETFLIX.COM', (i) => [15.49, 15.49, 17.99, 17.99, 17.99, 19.99, 19.99, 19.99][i] ?? 19.99, '2026-01-05', 8))[0];
    expect(r?.priceSteps.map((s) => [s.from, s.to])).toEqual([[15.49, 17.99], [17.99, 19.99]]);
  });
});

it('orders series by annual cost, biggest first, deterministically', () => {
  const out = detect(series('NETFLIX.COM', 15.49, '2026-01-05', 3), series('VERIZON WIRELESS', 165, '2026-01-03', 3), series('SPOTIFY USA', 11.99, '2026-01-09', 3));
  expect(out.map((r) => r.merchantId)).toEqual(['verizon', 'netflix', 'spotify']);
});
