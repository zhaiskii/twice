/**
 * End-to-end on the three demo statements with the BUNDLED catalog — the "must find" column of
 * docs/SPEC.md (Personas). These are the cases a judge will click first.
 * Depends on data/{carriers,plans,perks}.json being populated; skipped (not failed) while they are empty.
 */
import { describe, expect, it } from 'vitest';
import jordanCsv from '../fixtures/jordan_amex.csv?raw';
import mayaCsv from '../fixtures/maya_chase_card.csv?raw';
import priyaCsv from '../fixtures/priya_bofa_checking.csv?raw';
import { analyze, catalog, parseStatement, personas } from './index';
import type { Finding } from './types';

const CSV_BY_FILE: Record<string, string> = {
  'maya_chase_card.csv': mayaCsv,
  'jordan_amex.csv': jordanCsv,
  'priya_bofa_checking.csv': priyaCsv,
};

const persona = (id: string) => personas.find((p) => p.id === id)!;
const load = (id: string) => parseStatement(CSV_BY_FILE[persona(id).file] ?? '');
const ids = (findings: Finding[], kind: Finding['kind']) => findings.filter((f) => f.kind === kind).map((f) => f.id);

describe('persona fixtures', () => {
  it('personas.json lists all three, each with a CSV and the right detected format', () => {
    expect(personas.map((p) => p.id)).toEqual(['maya', 'jordan', 'priya']);
    for (const p of personas) {
      expect(CSV_BY_FILE[p.file], p.file).toBeDefined();
      expect(parseStatement(CSV_BY_FILE[p.file]!).format, p.id).toBe(p.format);
    }
  });

  it.each(['maya', 'jordan', 'priya'])('%s: 150–250 rows, nothing unreadable, charges mostly positive', (id) => {
    const r = load(id);
    expect(r.transactions.length).toBeGreaterThanOrEqual(150);
    expect(r.transactions.length).toBeLessThanOrEqual(250);
    expect(r.warnings).toEqual([]);
    expect(r.transactions.every((t) => t.date >= '2025-11-01' && t.date <= '2026-10-31')).toBe(true);
    expect(r.transactions.some((t) => t.amount < 0)).toBe(true); // refunds / payments / deposits
  });
});

describe.skipIf(catalog.perks.length === 0 || catalog.plans.length === 0 || catalog.carriers.length === 0)('persona analysis (bundled catalog)', () => {
  describe('Maya · Chase card · Verizon + Walmart+ & Peacock + DashPass + two music apps', () => {
    const maya = persona('maya');
    const txs = load('maya').transactions;
    const a = analyze(txs, maya.profile);

    it('phone_switch: Verizon → a cheaper plan on the same network', () => {
      const f = a.findings.find((x) => x.id === 'phone_switch:verizon');
      expect(f).toBeDefined();
      expect(f!.annualSavings.high).toBeGreaterThan(f!.annualSavings.low);
      expect(f!.annualSavings.low).toBeGreaterThan(0);
      expect(f!.confidence).toBe('high'); // she said 2 lines
      expect(f!.alternatives?.length).toBeGreaterThan(0);
      expect(f!.kit.length).toBeGreaterThanOrEqual(3);
    });

    it('paying_twice ×2: Peacock via Walmart+ (seen on the statement) and DashPass via the card (quiz)', () => {
      expect(ids(a.findings, 'paying_twice').sort()).toEqual(['paying_twice:chase_sapphire_preferred:dashpass', 'paying_twice:walmart_plus:peacock']);
    });

    it('overlap: music (Spotify + Apple Music) and nothing else', () => {
      expect(ids(a.findings, 'overlap')).toEqual(['overlap:music']);
    });

    it('price_step ×1–2: Verizon +$10 and Peacock', () => {
      const steps = ids(a.findings, 'price_step');
      expect(steps.length).toBeGreaterThanOrEqual(1);
      expect(steps.length).toBeLessThanOrEqual(2);
      expect(steps).toContain('price_step:verizon');
    });

    it('the DashPass quiz perk is withheld until she says she has the card', () => {
      const before = analyze(txs, { phoneLines: 2 });
      expect(ids(before.findings, 'paying_twice')).toEqual(['paying_twice:walmart_plus:peacock']);
      expect(before.needs.map((n) => n.id)).toEqual(['perkProviders']);
    });

    it('does not mistake DoorDash orders, Uber rides, Amazon orders or bare APPLE.COM/BILL for subscriptions we claim things about', () => {
      const merchants = a.recurring.map((r) => r.merchantId);
      expect(merchants).toEqual(expect.arrayContaining(['verizon', 'walmart_plus', 'peacock', 'dashpass', 'spotify', 'apple_music', 'apple_services']));
      expect(merchants).not.toContain('uber_one');
      expect(merchants).not.toContain('amazon_prime');
      expect(merchants.filter((m) => m.startsWith('unknown:'))).toEqual([]);
    });

    it('headline total is positive, ordered low ≤ high, and counts nothing twice', () => {
      expect(a.totals.annualLow).toBeGreaterThan(0);
      expect(a.totals.annualLow).toBeLessThanOrEqual(a.totals.annualHigh);
      const naive = a.findings.reduce((sum, f) => sum + f.annualSavings.high, 0);
      expect(a.totals.annualHigh).toBeLessThanOrEqual(naive);
    });
  });

  describe('Jordan · Amex · T-Mobile 3 lines + Netflix, iCloud+, Google One, Uber One, DashPass', () => {
    const jordan = persona('jordan');
    const txs = load('jordan').transactions;

    it('before the quiz: phone_switch + overlap ×2, no Netflix claim yet, and the quiz asks about plans', () => {
      const a = analyze(txs, { phoneLines: 3 });
      expect(ids(a.findings, 'phone_switch')).toEqual(['phone_switch:tmobile']);
      expect(ids(a.findings, 'overlap').sort()).toEqual(['overlap:cloud_storage', 'overlap:delivery']);
      expect(ids(a.findings, 'paying_twice')).toEqual([]);
      const q = a.needs.find((n) => n.id === 'perkProviders');
      expect(q?.options?.map((o) => o.value)).toContain('tmobile_experience_more');
      expect(q?.reason).toMatch(/Netflix/);
    });

    it('after confirming the Experience plan: paying_twice Netflix appears', () => {
      const a = analyze(txs, jordan.profile);
      expect(ids(a.findings, 'paying_twice')).toEqual(['paying_twice:tmobile_experience_more:netflix']);
      expect(ids(a.findings, 'phone_switch')).toEqual(['phone_switch:tmobile']);
      expect(ids(a.findings, 'overlap')).toHaveLength(2);
      expect(a.needs).toEqual([]);
    });

    it('asks for phone lines when the profile does not say', () => {
      expect(analyze(txs, {}).needs.map((n) => n.id)).toContain('phoneLines');
    });

    it('the accidental Netflix double charge and its refund do not break the series', () => {
      const netflix = analyze(txs, {}).recurring.find((r) => r.merchantId === 'netflix');
      expect(netflix?.cadence).toBe('monthly');
      expect(netflix?.transactionIds).toHaveLength(12);
    });
  });

  describe('Priya · BofA checking · already lean', () => {
    const a = analyze(load('priya').transactions, persona('priya').profile);

    it('produces NO savings findings and a zero total (no fake savings)', () => {
      expect(a.findings.filter((f) => f.kind !== 'price_step')).toEqual([]);
      expect(a.totals).toMatchObject({ annualLow: 0, annualHigh: 0 });
      expect(a.findings.every((f) => f.annualSavings.high === 0)).toBe(true);
    });

    it('still sees what she pays for, and asks nothing', () => {
      expect(a.recurring.map((r) => r.merchantId)).toEqual(expect.arrayContaining(['mint', 'netflix', 'spotify']));
      expect(a.totals.recurringAnnual).toBeGreaterThan(0);
      expect(a.needs).toEqual([]);
    });

    it('does not treat rent, payroll, Zelle or card payments as subscriptions', () => {
      const unknown = a.recurring.filter((r) => r.merchantId.startsWith('unknown:')).map((r) => r.merchantId);
      expect(unknown).toEqual(['unknown:COMCAST CABLE COMM']);
    });
  });
});
