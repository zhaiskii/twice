/**
 * Integrity of the bundled catalog (data/*.json): ids are unique and cross-referenced correctly,
 * every regex compiles, and every sourced row carries a url + checkedOn (AGENTS.md rule 2).
 */
import { describe, expect, it } from 'vitest';
import { catalog } from './index';

// AGENT: keep in sync with "Canonical ids → merchants" in docs/SPEC.md.
const CANONICAL_MERCHANTS = [
  'netflix', 'hulu', 'disney_plus', 'max', 'peacock', 'paramount_plus', 'apple_tv', 'youtube_premium', 'spotify', 'apple_music',
  'amazon_music', 'icloud', 'google_one', 'dropbox', 'dashpass', 'uber_one', 'instacart_plus', 'grubhub_plus', 'walmart_plus',
  'amazon_prime', 'verizon', 'att', 'tmobile', 'visible', 'mint', 'cricket', 'metro', 'us_mobile', 'tello', 'planet_fitness',
];
const CATEGORIES = ['streaming_video', 'music', 'cloud_storage', 'delivery', 'membership', 'wireless', 'gym', 'news', 'software', 'other'];

describe('merchants.json', () => {
  const ids = catalog.merchants.map((m) => m.id);

  it('has every canonical merchant id from the SPEC', () => {
    for (const id of CANONICAL_MERCHANTS) expect(ids, id).toContain(id);
  });

  it('has unique snake_case ids, valid categories and at least one pattern each', () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of catalog.merchants) {
      expect(m.id, m.id).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(CATEGORIES, m.id).toContain(m.category);
      expect(m.patterns.length, m.id).toBeGreaterThan(0);
    }
  });

  it('every pattern compiles', () => {
    for (const m of catalog.merchants) for (const p of m.patterns) expect(() => new RegExp(p, 'i'), `${m.id}: ${p}`).not.toThrow();
  });

  it('carrierId is set exactly on wireless merchants and points at a carriers.json row', () => {
    const carrierIds = new Set(catalog.carriers.map((c) => c.id));
    for (const m of catalog.merchants) {
      expect(Boolean(m.carrierId), m.id).toBe(m.category === 'wireless');
      if (m.carrierId && carrierIds.size > 0) expect(carrierIds, m.id).toContain(m.carrierId);
    }
  });
});

describe('cross-references between data files', () => {
  const merchantIds = new Set(catalog.merchants.map((m) => m.id));

  it('perks point at real merchants and, for statement perks, a provider merchant', () => {
    for (const p of catalog.perks) {
      expect(merchantIds, `${p.id} includesMerchantId`).toContain(p.includesMerchantId);
      if (p.detection === 'statement') expect(merchantIds, `${p.id} providerMerchantId`).toContain(p.providerMerchantId);
    }
  });

  it('every carrier, plan and perk row is sourced (url + checkedOn)', () => {
    for (const row of [...catalog.carriers, ...catalog.plans, ...catalog.perks]) {
      expect(row.url, row.id).toMatch(/^https:\/\//);
      expect(row.checkedOn, row.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('plans run on one of the three networks and carriers have unique ids', () => {
    for (const p of catalog.plans) expect(['verizon', 'tmobile', 'att'], p.id).toContain(p.network);
    const ids = catalog.carriers.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
