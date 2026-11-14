import { describe, expect, it } from 'vitest';
import { normalizeDescriptor, matchMerchant } from './normalize';
import { catalog } from './index';

const id = (raw: string) => matchMerchant(raw, catalog.merchants).merchantId;

describe('normalizeDescriptor', () => {
  it.each([
    ['SQ *BLUE BOTTLE 1234 OAKLAND CA', 'BLUE BOTTLE OAKLAND'],
    ['TST* TORCHYS TACOS - 1234 AUSTIN TX', 'TORCHYS TACOS - AUSTIN'],
    ['PAYPAL *SPOTIFYUSA 402-935-7733', 'SPOTIFYUSA'],
    ['GOOGLE *Google One g.co/helppay# CA', 'GOOGLE ONE G.CO/HELPPAY#'],
    ['Netflix.com Los Gatos CA', 'NETFLIX.COM LOS GATOS'],
    ['PURCHASE AUTHORIZED ON 11/03 TRADER JOE S #123 AUSTIN TX S465307', "TRADER JOE S AUSTIN"],
    ['CHECKCARD 1104 SPOTIFY USA 877-7781161 NY 24692162308', 'SPOTIFY USA'],
    ['SPOTIFY P1A2B3', 'SPOTIFY'],
    ['AMZN Mktp US*2K4AB3X', 'AMZN MKTP US'],
    ['TMOBILE*AUTO PAY            800-937-8997        WA', 'TMOBILE AUTO PAY'],
  ])('%s → %s', (raw, expected) => expect(normalizeDescriptor(raw)).toBe(expected));

  it('keeps APPLE.COM/BILL intact (the service behind it is ambiguous)', () => {
    expect(normalizeDescriptor('APPLE.COM/BILL 866-712-7753 CA')).toBe('APPLE.COM/BILL');
  });

  it('never returns an empty key', () => {
    expect(normalizeDescriptor('123456')).toBe('123456');
    expect(normalizeDescriptor('')).toBe('');
  });

  it('is stable across months for the same store (so unknown: keys group)', () => {
    expect(normalizeDescriptor('H-E-B #482 AUSTIN TX')).toBe(normalizeDescriptor('H-E-B #119 AUSTIN TX'));
  });
});

describe('merchant matching against the bundled catalog', () => {
  it.each([
    ['NETFLIX.COM', 'netflix'],
    ['Netflix.com Los Gatos CA', 'netflix'],
    ['PAYPAL *NETFLIX', 'netflix'],
    ['HULU 877-8244858 CA', 'hulu'],
    ['DISNEY PLUS', 'disney_plus'],
    ['DISNEY+ 888-905-7888', 'disney_plus'],
    ['HBO MAX', 'max'],
    ['PEACOCK PREMIUM', 'peacock'],
    ['PARAMOUNT+', 'paramount_plus'],
    ['GOOGLE *YOUTUBEPREMIUM', 'youtube_premium'],
    ['SPOTIFY USA', 'spotify'],
    ['Spotify P1A2B3', 'spotify'],
    ['APPLE.COM/BILL APPLE MUSIC 866-712-7753 CA', 'apple_music'],
    ['APPLE.COM/BILL ICLOUD 866-712-7753 CA', 'icloud'],
    ['GOOGLE *Google One', 'google_one'],
    ['DROPBOX', 'dropbox'],
    ['DOORDASH DASHPASS', 'dashpass'],
    ['DD *DASHPASS', 'dashpass'],
    ['UBER *ONE', 'uber_one'],
    ['UBER *ONE help.uber.com CA', 'uber_one'],
    ['INSTACART+', 'instacart_plus'],
    ['INSTACART*SUBSCRIPTION', 'instacart_plus'],
    ['WALMART+ MEMBERSHIP', 'walmart_plus'],
    ['AMAZON PRIME*2K4AB3X', 'amazon_prime'],
    ['VERIZON WIRELESS', 'verizon'],
    ['VERIZON WRLS*MY VZ VB P', 'verizon'],
    ['VZWRLSS*MY VERIZON', 'verizon'],
    ['TMOBILE*AUTO PAY', 'tmobile'],
    ['T-MOBILE', 'tmobile'],
    ['ATT*BILL PAYMENT', 'att'],
    ['AT&T', 'att'],
    ['AT&T *BILL PAYMT 800-331-0500 TX', 'att'],
    ['MINT MOBILE', 'mint'],
    ['VISIBLE', 'visible'],
    ['CRICKET WIRELESS', 'cricket'],
    ['PLANET FITNESS', 'planet_fitness'],
  ])('%s → %s', (raw, expected) => expect(id(raw)).toBe(expected));

  describe('look-alikes that must NOT match (the "careful" list)', () => {
    it('VZWRLSS*APOCC VISB is Visible, not Verizon', () => {
      expect(id('VZWRLSS*APOCC VISB')).toBe('visible');
    });

    it('DoorDash food orders are not DashPass', () => {
      for (const d of ['DOORDASH*CHIPOTLE', 'DD *DOORDASH WINGSTOP', 'DOORDASH, INC. 855-123-4567 CA']) {
        expect(id(d)).not.toBe('dashpass');
      }
    });

    it('Uber rides and Uber Eats are not Uber One', () => {
      for (const d of ['UBER *TRIP HELP.UBER.COM', 'UBER *EATS', 'UBER TRIP', 'UBER EATS PENDING']) {
        expect(id(d)).not.toBe('uber_one');
      }
    });

    it('Amazon purchases and Prime Video rentals are not Prime', () => {
      for (const d of ['AMAZON.COM*1A2B3C4D5', 'AMZN Mktp US*2K4AB3X', 'Amazon.com Seattle WA', 'AMAZON PRIME VIDEO RENTAL']) {
        expect(id(d)).not.toBe('amazon_prime');
      }
    });

    it('AT&T / Verizon internet and TV are not wireless', () => {
      expect(id('ATT*INTERNET')).not.toBe('att');
      expect(id('AT&T U-VERSE')).not.toBe('att');
      expect(id('VERIZON FIOS')).not.toBe('verizon');
      expect(id('T-MOBILE HOME INTERNET')).not.toBe('tmobile');
    });

    it('a bare APPLE.COM/BILL is unattributed (iCloud, Music and TV all bill as that)', () => {
      expect(id('APPLE.COM/BILL 866-712-7753 CA')).toBe('apple_services');
    });

    it('unmatched descriptors become unknown:<normalized> with a readable name', () => {
      const m = matchMerchant('SQ *EPIC ESPRESSO 1234 AUSTIN TX', catalog.merchants);
      expect(m.merchantId).toBe('unknown:EPIC ESPRESSO AUSTIN');
      expect(m.merchantName).toBe('Epic Espresso Austin');
      expect(m.known).toBe(false);
    });

    it('money movement is flagged as not subscription-like (only when uncatalogued)', () => {
      expect(matchMerchant('Zelle payment to LANDLORD Conf# abc', catalog.merchants).subscriptionLike).toBe(false);
      expect(matchMerchant('CHASE CREDIT CRD AUTOPAY', catalog.merchants).subscriptionLike).toBe(false);
      expect(matchMerchant('ATT*BILL PAYMENT', catalog.merchants).subscriptionLike).toBe(true);
      expect(matchMerchant('TMOBILE*AUTO PAY', catalog.merchants).subscriptionLike).toBe(true);
    });
  });

  it('survives an invalid regex in a catalog row', () => {
    const rows = [{ id: 'bad', name: 'Bad', category: 'other' as const, patterns: ['('] }, { id: 'ok', name: 'Ok', category: 'other' as const, patterns: ['OK'] }];
    expect(matchMerchant('OK CAFE', rows).merchantId).toBe('ok');
  });
});
