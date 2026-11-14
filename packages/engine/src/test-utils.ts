/**
 * Owns: builders shared by the engine tests (not exported from index.ts, never shipped).
 * Tiny inline catalogs keep rule tests independent of the bundled JSON data.
 */
import { addDays } from './dates';
import type { Catalog, MerchantRow, Transaction } from './types';

let counter = 0;

export function tx(date: string, description: string, amount: number, id?: string): Transaction {
  return { id: id ?? `t:${++counter}`, date, description, amount, format: 'generic' };
}

/** `count` charges, `gapDays` apart, starting at `start`. Amount may vary per index. */
export function series(description: string, amount: number | ((i: number) => number), start: string, count: number, gapDays = 30): Transaction[] {
  return Array.from({ length: count }, (_, i) => tx(addDays(start, i * gapDays), description, typeof amount === 'function' ? amount(i) : amount, `${description}#${i}`));
}

export const MERCHANTS: MerchantRow[] = [
  { id: 'netflix', name: 'Netflix', category: 'streaming_video', patterns: ['NETFLIX'] },
  { id: 'hulu', name: 'Hulu', category: 'streaming_video', patterns: ['HULU'] },
  { id: 'max', name: 'Max', category: 'streaming_video', patterns: ['HBO ?MAX'] },
  { id: 'spotify', name: 'Spotify', category: 'music', patterns: ['SPOTIFY'] },
  { id: 'apple_music', name: 'Apple Music', category: 'music', patterns: ['APPLE MUSIC'] },
  { id: 'dashpass', name: 'DashPass', category: 'delivery', patterns: ['DASHPASS'] },
  { id: 'walmart_plus', name: 'Walmart+', category: 'membership', patterns: ['WALMART\\+'] },
  { id: 'amazon_prime', name: 'Amazon Prime', category: 'membership', patterns: ['AMAZON PRIME'] },
  { id: 'peacock', name: 'Peacock', category: 'streaming_video', patterns: ['^PEACOCK'] },
  { id: 'verizon', name: 'Verizon', category: 'wireless', patterns: ['^VERIZON'], carrierId: 'verizon' },
  { id: 'tmobile', name: 'T-Mobile', category: 'wireless', patterns: ['^T-?MOBILE'], carrierId: 'tmobile' },
  { id: 'mint', name: 'Mint Mobile', category: 'wireless', patterns: ['MINT MOBILE'], carrierId: 'mint' },
];

const CHECKED = '2026-11-01';

export const TINY_CATALOG: Catalog = {
  merchants: MERCHANTS,
  carriers: [
    {
      id: 'verizon', name: 'Verizon', network: 'verizon', isBigThree: true,
      portOut: [{ title: 'Get your transfer PIN', body: 'Text PORTOUT to 611611.' }],
      warnings: ['Verizon locks new phones for 60 days.'], url: 'https://example.com/vz', checkedOn: CHECKED,
    },
    { id: 'tmobile', name: 'T-Mobile', network: 'tmobile', isBigThree: true, portOut: [{ title: 'Get your port-out PIN', body: 'Call 611.' }], warnings: [], url: 'https://example.com/tmo', checkedOn: CHECKED },
    { id: 'mint', name: 'Mint Mobile', network: 'tmobile', isBigThree: false, portOut: [], warnings: [], url: 'https://example.com/mint', checkedOn: CHECKED },
  ],
  plans: [
    { id: 'vz_a', brand: 'Visible', name: 'Visible', network: 'verizon', monthlyPerLine: 25, monthlyTotalByLines: { '2': 40 }, taxesIncluded: true, highlights: [], url: 'https://example.com/visible', checkedOn: CHECKED },
    { id: 'vz_b', brand: 'Total Wireless', name: 'Unlimited', network: 'verizon', monthlyPerLine: 30, taxesIncluded: false, highlights: [], url: 'https://example.com/total', checkedOn: CHECKED },
    { id: 'vz_c', brand: 'Straight Talk', name: 'Premium', network: 'verizon', monthlyPerLine: 45, taxesIncluded: true, highlights: [], url: 'https://example.com/st', checkedOn: CHECKED },
    { id: 'vz_d', brand: 'Pricey', name: 'Costs more', network: 'verizon', monthlyPerLine: 120, taxesIncluded: true, highlights: [], url: 'https://example.com/pricey', checkedOn: CHECKED },
    { id: 'tmo_a', brand: 'Mint', name: 'Unlimited', network: 'tmobile', monthlyPerLine: 30, taxesIncluded: false, highlights: [], url: 'https://example.com/mint-plan', checkedOn: CHECKED },
  ],
  perks: [
    {
      id: 'walmart_plus__peacock', provider: { id: 'walmart_plus', name: 'Walmart+', kind: 'membership' },
      includesMerchantId: 'peacock', includedTier: 'Peacock Premium', includedTierMonthly: 7.99,
      detection: 'statement', providerMerchantId: 'walmart_plus', conditions: 'Choose Peacock or Paramount+ in your Walmart+ account.',
      kit: [{ title: 'Activate Peacock in Walmart+', body: 'Open the Walmart+ benefits page.' }], url: 'https://example.com/w', checkedOn: CHECKED,
    },
    {
      id: 'tmobile_more__netflix', provider: { id: 'tmobile_experience_more', name: 'T-Mobile Experience More', kind: 'phone_plan' },
      includesMerchantId: 'netflix', includedTier: 'Netflix Standard with ads', includedTierMonthly: 7.99,
      detection: 'quiz', carrierId: 'tmobile', conditions: 'Experience More and Beyond plans only.',
      kit: [{ title: 'Redeem Netflix in the T-Life app', body: 'Open T-Life, then Benefits.' }], url: 'https://example.com/t', checkedOn: CHECKED,
    },
    {
      id: 'chase__dashpass', provider: { id: 'chase_sapphire_preferred', name: 'Chase Sapphire Preferred', kind: 'card' },
      includesMerchantId: 'dashpass', includedTier: 'DashPass for 1 year', includedTierMonthly: 9.99,
      detection: 'quiz', conditions: 'Activate with the card before your next DashPass charge.',
      kit: [], url: 'https://example.com/c', checkedOn: CHECKED,
    },
  ],
};
