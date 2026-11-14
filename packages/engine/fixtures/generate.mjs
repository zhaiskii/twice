// SYNTHETIC DATA — every merchant, amount and person below is invented. This script writes the three
// demo statements (fixtures/*.csv) deterministically: same seed, same bytes, no Date.now / Math.random.
// Run:  node packages/engine/fixtures/generate.mjs
//
// Each persona gets its bank's REAL export header and sign convention, so the parsers are exercised by
// the same shapes a judge's own file would have:
//   Maya   Chase card      purchases NEGATIVE, payments positive
//   Jordan Amex            charges POSITIVE, payments/credits negative
//   Priya  BofA checking   summary preamble + header, debits negative, running balance
// Window: Nov 2025 -> Oct 2026 (12 months). personas.json (profile pre-fills) is hand-written.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// ─── tiny deterministic toolkit ─────────────────────────────────────────────

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ y: i < 2 ? 2025 : 2026, m: i < 2 ? 11 + i : i - 1 })); // Nov 2025 … Oct 2026
const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const usDate = (isoDate) => `${isoDate.slice(5, 7)}/${isoDate.slice(8, 10)}/${isoDate.slice(0, 4)}`;
const addDays = (isoDate, n) => new Date(Date.parse(isoDate + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const cents = (n) => Math.round(n * 100) / 100;

function makeWorld(seed) {
  const rng = mulberry32(seed);
  const int = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const money = (lo, hi) => cents(lo + rng() * (hi - lo));
  const events = [];
  // `out` > 0 = money out. cat = Chase-style category (only the Chase writer uses it).
  const add = (date, desc, out, cat = 'Shopping') => events.push({ date, desc, out: cents(out), cat });

  /** One charge per month on ~`day` (±1 day of drift, like a real biller). */
  const monthly = (day, desc, amount, cat) =>
    MONTHS.forEach((mo, i) => add(iso(mo.y, mo.m, Math.min(28, Math.max(1, day + int(-1, 1)))), typeof desc === 'function' ? desc(i) : desc, amount(i), cat));

  /** n (or [lo, hi]) random-day purchases per month. */
  const scatter = (perMonth, descs, lo, hi, cat) =>
    MONTHS.forEach((mo) => {
      const n = Array.isArray(perMonth) ? int(perMonth[0], perMonth[1]) : perMonth;
      for (let k = 0; k < n; k++) add(iso(mo.y, mo.m, int(1, 28)), typeof descs === 'function' ? descs() : pick(descs), money(lo, hi), cat);
    });

  return { rng, int, pick, money, events, add, monthly, scatter };
}

const csvCell = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const csvLine = (cells) => cells.map(csvCell).join(',');
const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
const group = (n) => n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Add one card payment per month = the previous month's net card spending (first month: a fixed guess). */
function addCardPayments(w, desc, day, firstGuess) {
  const spend = new Map();
  for (const e of w.events) spend.set(e.date.slice(0, 7), (spend.get(e.date.slice(0, 7)) ?? 0) + e.out);
  MONTHS.forEach((mo, i) => {
    const prev = MONTHS[i - 1];
    const amount = prev ? (spend.get(`${prev.y}-${pad(prev.m)}`) ?? 0) : firstGuess;
    w.add(iso(mo.y, mo.m, day), desc, -cents(amount), 'Payment');
  });
}

// ─── Maya · Chase card ──────────────────────────────────────────────────────
// Austin renter. Verizon 2 lines $165 (+$10 in Aug 2026), Walmart+ AND Peacock, DashPass (her card
// includes it), Spotify AND Apple Music, plus an unattributable APPLE.COM/BILL charge.

function maya() {
  const w = makeWorld(1101);
  const r4 = () => String(w.int(1000, 9999));
  w.monthly(3, 'VERIZON WRLS*MY VZ VB P', (i) => (i >= 9 ? 175 : 165), 'Bills & Utilities');
  w.monthly(9, 'WALMART+ MEMBERSHIP 800-925-6278 AR', () => 12.95, 'Shopping');
  w.monthly(12, 'PEACOCK PREMIUM', (i) => (i >= 8 ? 10.99 : 7.99), 'Entertainment');
  w.monthly(15, 'DOORDASH DASHPASS', () => 9.99, 'Food & Drink');
  w.monthly(18, (i) => (i % 3 === 0 ? `SPOTIFY P${w.pick(['3F9A1C', '7B2D4E', '9C1E5A'])}` : 'SPOTIFY USA'), () => 11.99, 'Entertainment');
  w.monthly(21, 'APPLE.COM/BILL APPLE MUSIC 866-712-7753 CA', () => 10.99, 'Entertainment');
  w.monthly(24, 'APPLE.COM/BILL 866-712-7753 CA', () => 2.99, 'Shopping');

  w.scatter([2, 3], () => w.pick([`H-E-B #${w.int(100, 700)} AUSTIN TX`, `TRADER JOE'S #${w.int(100, 199)} AUSTIN TX`, `WHOLEFDS AUS ${w.int(10100, 10300)} AUSTIN TX`]), 24, 96, 'Groceries');
  w.scatter([2, 3], () => w.pick(['SQ *EPIC ESPRESSO AUSTIN TX', `TST* TORCHYS TACOS - ${r4()} AUSTIN TX`, `CHIPOTLE ${r4()}`, `STARBUCKS STORE ${w.int(10000, 99999)}`, 'SQ *KERBEY LANE CAFE', 'PAYPAL *LAMBERTS BBQ']), 8, 46, 'Food & Drink');
  w.scatter([1, 2], ['UBER *TRIP HELP.UBER.COM CA'], 7, 28, 'Travel');
  w.scatter([0, 2], () => w.pick(['DOORDASH*CHIPOTLE', 'DD *DOORDASH WINGSTOP', 'DOORDASH*PHO SAIGON']), 14, 38, 'Food & Drink');
  w.scatter([1, 2], () => w.pick([`AMZN Mktp US*${w.pick(['2K4AB3X', '1A2B3C4', '9Z8Y7X6'])}`, `Amazon.com*${w.pick(['1A2B3C4D5', '7Q8R9S0T1'])}`]), 9, 85, 'Shopping');
  w.scatter([0, 1], () => w.pick([`SHELL OIL ${w.int(57400000000, 57499999999)}`, `EXXONMOBIL ${w.int(4400, 4599)}`]), 28, 47, 'Gas');
  w.scatter([0, 1], () => w.pick([`CVS/PHARMACY #0${w.int(8000, 8999)}`, `TARGET 0000${w.int(1000, 2999)}`]), 6, 52, 'Shopping');
  w.add('2026-03-14', 'SOUTHWEST AIRLINES 5262310889', 214.4, 'Travel');
  // Refunds ("Return" rows: money back to the card).
  w.add('2026-01-19', 'AMZN Mktp US*2K4AB3X', -32.18, 'Shopping');
  w.add('2026-06-02', 'TARGET 000012345', -24.99, 'Shopping');
  addCardPayments(w, 'Payment Thank You-Mobile', 26, 640.18);

  const rows = w.events.filter((e) => e.date <= '2026-10-31').sort(byDate).reverse(); // Chase exports newest first
  const header = 'Transaction Date,Post Date,Description,Category,Type,Amount,Memo';
  const lines = rows.map((e) => {
    const type = e.cat === 'Payment' ? 'Payment' : e.out < 0 ? 'Return' : 'Sale';
    return csvLine([usDate(e.date), usDate(addDays(e.date, 1)), e.desc, e.cat === 'Payment' ? '' : e.cat, type, (-e.out).toFixed(2), '']);
  });
  return [header, ...lines].join('\n') + '\n';
}

// ─── Jordan · Amex ──────────────────────────────────────────────────────────
// Couple. T-Mobile 3 lines (Experience plan), pays Netflix + iCloud+ + Google One, Uber One + DashPass.

function jordan() {
  const w = makeWorld(2202);
  const wide = (name, place = '', state = '') => `${name.padEnd(28)}${place.padEnd(20)}${state}`.trimEnd();
  w.monthly(2, wide('TMOBILE*AUTO PAY', '800-937-8997', 'WA'), () => 152.4, 'Bills');
  w.monthly(6, wide('NETFLIX.COM', 'LOS GATOS', 'CA'), (i) => (i >= 7 ? 17.99 : 15.49), 'Entertainment');
  w.monthly(10, wide('APPLE.COM/BILL ICLOUD', '866-712-7753', 'CA'), () => 9.99, 'Bills');
  w.monthly(14, wide('GOOGLE *Google One', 'g.co/helppay#', 'CA'), () => 9.99, 'Bills');
  w.monthly(17, wide('UBER *ONE', 'help.uber.com', 'CA'), () => 9.99, 'Travel');
  w.monthly(22, wide('DOORDASH DASHPASS', 'DOORDASH.COM', 'CA'), () => 9.99, 'Food');

  const who = () => w.pick(['JORDAN LEE', 'JORDAN LEE', 'SAM LEE']);
  w.scatter([2, 3], () => w.pick([wide(`WHOLEFDS AUS ${w.int(10100, 10300)}`, 'AUSTIN', 'TX'), wide(`COSTCO WHSE #${w.int(100, 999)}`, 'AUSTIN', 'TX'), wide(`H-E-B #${w.int(100, 700)}`, 'AUSTIN', 'TX')]), 31, 168, 'Groceries');
  w.scatter([2, 4], () => w.pick([wide('AplPay CHIPOTLE', 'AUSTIN', 'TX'), wide('SQ *EPIC ESPRESSO', 'AUSTIN', 'TX'), wide(`TST* TORCHYS TACOS - ${w.int(1000, 9999)}`, 'AUSTIN', 'TX'), wide('SHAKE SHACK AUSTIN', 'AUSTIN', 'TX')]), 9, 78, 'Food');
  w.scatter([1, 2], () => wide('UBER *TRIP', 'help.uber.com', 'CA'), 8, 34, 'Travel');
  w.scatter([0, 2], () => w.pick([wide('UBER *EATS', 'help.uber.com', 'CA'), wide('DOORDASH*TACO BELL', 'DOORDASH.COM', 'CA'), wide('DD *DOORDASH PANDA EXP', 'DOORDASH.COM', 'CA')]), 15, 44, 'Food');
  w.scatter([1, 2], () => w.pick([wide(`AMAZON.COM*${w.pick(['1A2B3C4D5', '8H7G6F5E4'])}`, 'SEATTLE', 'WA'), wide(`AMZN Mktp US*${w.pick(['2K4AB3X', '5T6U7V8'])}`, 'SEATTLE', 'WA')]), 11, 120, 'Shopping');
  w.scatter([0, 1], () => w.pick([wide(`TARGET 0000${w.int(1000, 2999)}`, 'AUSTIN', 'TX'), wide(`SHELL OIL ${w.int(57400000000, 57499999999)}`, 'AUSTIN', 'TX'), wide('CVS/PHARMACY #08123', 'AUSTIN', 'TX')]), 12, 74, 'Shopping');
  w.add('2026-04-02', wide('SOUTHWEST AIRLINES', 'DALLAS', 'TX'), 438.2, 'Travel');
  w.add('2026-04-05', wide('HILTON GARDEN INN', 'DENVER', 'CO'), 312.46, 'Travel');
  w.add('2026-02-10', wide('AMAZON.COM*1A2B3C4D5', 'SEATTLE', 'WA'), -46.77, 'Shopping'); // refund credit
  w.add('2026-08-21', wide('NETFLIX.COM', 'LOS GATOS', 'CA'), -17.99, 'Entertainment'); // refund credit (an accidental double charge)
  w.add('2026-08-21', wide('NETFLIX.COM', 'LOS GATOS', 'CA'), 17.99, 'Entertainment'); // …the double charge itself
  addCardPayments(w, 'AUTOPAY PAYMENT - THANK YOU', 27, 905.12);

  const rows = w.events.filter((e) => e.date <= '2026-10-31').sort(byDate).reverse(); // Amex exports newest first
  const header = 'Date,Description,Card Member,Account #,Amount';
  const lines = rows.map((e) => csvLine([usDate(e.date), e.desc, e.cat === 'Payment' ? 'JORDAN LEE' : who(), '-71009', e.out.toFixed(2)]));
  return [header, ...lines].join('\n') + '\n';
}

// ─── Priya · BofA checking ──────────────────────────────────────────────────
// Already lean: Mint Mobile, one music (Spotify, +$1 in Sep 2026), one streaming (Netflix), internet.

function priya() {
  const w = makeWorld(3303);
  const card = (kind, date, rest) => `${kind} ${date.slice(5, 7)}${date.slice(8, 10)} ${rest}`;
  const sub = (day, rest, amount, kind = 'PURCHASE') =>
    MONTHS.forEach((mo, i) => {
      const date = iso(mo.y, mo.m, Math.min(28, day + w.int(-1, 1)));
      w.add(date, card(kind, date, rest), typeof amount === 'function' ? amount(i) : amount);
    });

  sub(5, 'SPOTIFY USA 877-7781161 NY', (i) => (i >= 10 ? 12.99 : 11.99));
  sub(11, 'NETFLIX.COM LOS GATOS CA', 15.49);
  sub(8, 'MINT MOBILE 800-683-7392 CA', 30, 'CHECKCARD');
  w.monthly(20, 'COMCAST CABLE COMM 800-266-2278 PA', () => 60, 'Bills');
  w.monthly(1, 'Zelle payment to MAPLE GROVE APARTMENTS Conf# xk39d8s2', () => 1450);
  w.monthly(23, 'CHASE CREDIT CRD AUTOPAY PPD ID: 4760039224', () => w.money(180, 420));
  w.monthly(16, 'AUSTIN ENERGY DES:UTILITY ID:XXXXX INDN:PRIYA SHAH', () => w.money(62, 118));
  w.monthly(25, 'Online Banking transfer to SAV 4821 Confirmation# 3948572031', () => 1200);
  w.monthly(28, 'Interest Earned', () => -w.money(0.08, 0.41));

  // Payroll every other Friday starting 2025-11-07.
  for (let d = '2025-11-07'; d <= '2026-10-31'; d = addDays(d, 14)) w.add(d, 'ACME ANALYTICS DES:PAYROLL ID:0001234 INDN:PRIYA SHAH CO ID:1234567890 PPD', -1900);

  // Debit-card purchases carry a bank prefix + MMDD; the MMDD is re-stamped with the row date below.
  const debit = (rest) => `${w.pick(['PURCHASE', 'CHECKCARD'])} 0000 ${rest}`;
  w.scatter([2, 4], () => debit(w.pick([`H-E-B #${w.int(100, 700)} AUSTIN TX`, `TRADER JOE'S #${w.int(100, 199)} AUSTIN TX`])), 22, 88);
  w.scatter([2, 4], () => debit(w.pick(['SQ *EPIC ESPRESSO AUSTIN TX', `CHIPOTLE ${w.int(1000, 9999)} AUSTIN TX`, 'TST* TORCHYS TACOS AUSTIN TX', 'SQ *KERBEY LANE CAFE AUSTIN TX'])), 8, 42);
  w.scatter([0, 2], () => debit(w.pick([`AMZN Mktp US*${w.pick(['2K4AB3X', '1A2B3C4'])}`, `TARGET 0000${w.int(1000, 2999)} AUSTIN TX`])), 11, 74);
  w.scatter([0, 1], () => `Zelle payment to ${w.pick(['Dev Patel', 'Maria Gomez'])} Conf# ${w.pick(['a8f3k2', 'q9w8e7'])}`, 15, 60);
  w.scatter([0, 1], () => `BKOFAMERICA ATM ${w.int(1, 12)}/${w.int(10, 28)} #00000${w.int(1000, 9999)} WITHDRWL AUSTIN TX`, 20, 60);
  w.add('2026-03-09', 'PURCHASE REFUND 0309 AMZN Mktp US*2K4AB3X', -29.99);

  // Chronological, with the running balance; the first rows' description dates are re-stamped to each row's date.
  const rows = w.events.filter((e) => e.date <= '2026-10-31').sort(byDate);
  let balance = 3214.55;
  const begin = balance;
  let credits = 0;
  let debits = 0;
  const lines = rows.map((e) => {
    balance = cents(balance - e.out);
    if (e.out < 0) credits += -e.out;
    else debits += e.out;
    // Re-stamp MMDD prefix with the row's own date so descriptions and dates agree.
    const desc = e.desc.replace(/^(PURCHASE|CHECKCARD) \d{4} /, `$1 ${e.date.slice(5, 7)}${e.date.slice(8, 10)} `);
    return csvLine([usDate(e.date), desc, (-e.out).toFixed(2).replace(/^(-?)(\d+\.\d\d)$/, (_m, s, n) => s + group(Number(n))), group(balance)]);
  });
  const preamble = [
    'Description,,Summary Amt.',
    csvLine(['Beginning balance as of 11/01/2025', '', group(begin)]),
    csvLine(['Total credits', '', group(credits)]),
    csvLine(['Total debits', '', '-' + group(debits)]),
    csvLine(['Ending balance as of 10/31/2026', '', group(balance)]),
    '',
    'Date,Description,Amount,Running Bal.',
    csvLine(['11/01/2025', 'Beginning balance as of 11/01/2025', '', group(begin)]),
  ];
  return [...preamble, ...lines].join('\n') + '\n';
}

for (const [file, build] of [['maya_chase_card.csv', maya], ['jordan_amex.csv', jordan], ['priya_bofa_checking.csv', priya]]) {
  const text = build();
  fs.writeFileSync(path.join(here, file), text);
  console.log(`${file}: ${text.trimEnd().split('\n').length} lines`);
}
