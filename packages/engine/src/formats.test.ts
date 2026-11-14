import { describe, expect, it } from 'vitest';
import { parseStatement } from './index';

/** Engine convention: positive = money out. Each case: one purchase and one payment/credit. */
describe('bank formats and sign conventions', () => {
  it('chase_card: purchases negative in the file → positive; payments → negative', () => {
    const r = parseStatement(
      ['Transaction Date,Post Date,Description,Category,Type,Amount,Memo', '11/03/2025,11/04/2025,"NETFLIX.COM, LOS GATOS",Entertainment,Sale,-15.49,', '11/10/2025,11/10/2025,Payment Thank You-Mobile,,Payment,400.00,'].join('\n'),
    );
    expect(r.format).toBe('chase_card');
    expect(r.transactions.map((t) => [t.date, t.description, t.amount])).toEqual([
      ['2025-11-03', 'NETFLIX.COM, LOS GATOS', 15.49],
      ['2025-11-10', 'Payment Thank You-Mobile', -400],
    ]);
    expect(r.warnings).toEqual([]);
  });

  it('chase_checking: debits negative → positive; deposits → negative', () => {
    const r = parseStatement(
      ['Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #', 'DEBIT,11/03/2025,SPOTIFY USA,-11.99,DEBIT_CARD,1000.00,', 'CREDIT,11/07/2025,ACME PAYROLL,2000.00,ACH_CREDIT,3000.00,'].join('\n'),
    );
    expect(r.format).toBe('chase_checking');
    expect(r.transactions.map((t) => t.amount)).toEqual([11.99, -2000]);
  });

  it('amex (5 columns): charges stay positive, credits negative', () => {
    const r = parseStatement(
      ['Date,Description,Card Member,Account #,Amount', '11/03/2025,NETFLIX.COM,JORDAN LEE,-71009,15.49', '11/12/2025,AUTOPAY PAYMENT - THANK YOU,JORDAN LEE,-71009,-300.00'].join('\n'),
    );
    expect(r.format).toBe('amex');
    expect(r.transactions.map((t) => t.amount)).toEqual([15.49, -300]);
    expect(r.warnings).toEqual([]);
  });

  it('amex (3 columns): charges positive', () => {
    const r = parseStatement('Date,Description,Amount\n11/03/2025,NETFLIX.COM,15.49\n11/04/2025,UBER *TRIP,22.10\n11/12/2025,PAYMENT,-37.59\n');
    expect(r.format).toBe('amex');
    expect(r.transactions.map((t) => t.amount)).toEqual([15.49, 22.1, -37.59]);
  });

  it('3-column file whose rows are mostly negative is flipped (a checking export, not Amex)', () => {
    const r = parseStatement('Date,Description,Amount\n11/03/2025,NETFLIX.COM,-15.49\n11/04/2025,UBER,-22.10\n11/05/2025,COFFEE,-4.50\n11/07/2025,PAYROLL,2000.00\n');
    expect(r.transactions.map((t) => t.amount)).toEqual([15.49, 22.1, 4.5, -2000]);
    expect(r.warnings[0]).toMatch(/negative amounts as charges/);
  });

  it('bofa_checking: skips the summary preamble, debits negative → positive', () => {
    const csv = [
      'Description,,Summary Amt.',
      'Beginning balance as of 11/01/2025,,"3,214.55"',
      'Total credits,,"1,900.00"',
      'Total debits,,"-1,450.00"',
      'Ending balance as of 11/30/2025,,"3,664.55"',
      '',
      'Date,Description,Amount,Running Bal.',
      '11/01/2025,Beginning balance as of 11/01/2025,,"3,214.55"',
      '11/01/2025,Zelle payment to LANDLORD,"-1,450.00","1,764.55"',
      '11/07/2025,ACME PAYROLL,"1,900.00","3,664.55"',
    ].join('\r\n');
    const r = parseStatement(csv);
    expect(r.format).toBe('bofa_checking');
    expect(r.transactions.map((t) => t.amount)).toEqual([1450, -1900]);
    expect(r.skippedRows).toBe(7); // 6 preamble/blank lines + the "Beginning balance" row
    expect(r.warnings).toEqual([]); // expected skips are not worth a warning
  });

  it('bofa_card: purchases negative → positive', () => {
    const r = parseStatement(
      ['Posted Date,Reference Number,Payee,Address,Amount', '11/03/2025,24692162308,NETFLIX.COM,LOS GATOS CA,-15.49', '11/09/2025,24692162999,PAYMENT - THANK YOU,,250.00'].join('\n'),
    );
    expect(r.format).toBe('bofa_card');
    expect(r.transactions.map((t) => [t.description, t.amount])).toEqual([['NETFLIX.COM', 15.49], ['PAYMENT - THANK YOU', -250]]);
  });

  it('capital_one: Debit column is money out, Credit is money in', () => {
    const r = parseStatement(
      ['Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit', '2025-11-03,2025-11-04,1234,NETFLIX.COM,Entertainment,15.49,', '2025-11-10,2025-11-11,1234,CAPITAL ONE MOBILE PYMT,Payment/Credit,,300.00'].join('\n'),
    );
    expect(r.format).toBe('capital_one');
    expect(r.transactions.map((t) => t.amount)).toEqual([15.49, -300]);
    expect(r.transactions[0]?.date).toBe('2025-11-03');
  });

  it('discover: purchases positive, payments negative', () => {
    const r = parseStatement(
      ['Trans. Date,Post Date,Description,Amount,Category', '11/03/2025,11/04/2025,NETFLIX.COM,15.49,Services', '11/10/2025,11/10/2025,DIRECTPAY FULL BALANCE,-100.00,Payments and Credits'].join('\n'),
    );
    expect(r.format).toBe('discover');
    expect(r.transactions.map((t) => t.amount)).toEqual([15.49, -100]);
  });

  describe('generic fallback', () => {
    it('finds date / description / amount by name, negative = money out by default', () => {
      const r = parseStatement('Transaction Date,Memo,Amount (USD)\n11/03/25,NETFLIX,-15.49\n11/04/25,COFFEE,-4.00\n11/05/25,REFUND,9.99\n');
      expect(r.format).toBe('generic');
      expect(r.transactions.map((t) => t.amount)).toEqual([15.49, 4, -9.99]);
      expect(r.transactions[0]?.date).toBe('2025-11-03');
    });

    it('flips when most rows are positive (a card export with charges positive)', () => {
      const r = parseStatement('Date,Merchant,Amount\n2025-11-03,NETFLIX,15.49\n2025-11-04,UBER,22.10\n2025-11-05,COFFEE,4.50\n2025-11-06,REFUND,-9.99\n');
      // Not 3 columns "Description": merchant column → generic, majority positive → positive = out.
      expect(r.format).toBe('generic');
      expect(r.transactions.map((t) => t.amount)).toEqual([15.49, 22.1, 4.5, -9.99]);
      expect(r.warnings[0]).toMatch(/positive amounts as charges/);
    });

    it('reads withdrawal / deposit columns', () => {
      const r = parseStatement('Date,Narrative,Withdrawals,Deposits\n11/03/2025,RENT,1000.00,\n11/04/2025,SALARY,,2000.00\n');
      expect(r.transactions.map((t) => t.amount)).toEqual([1000, -2000]);
    });
  });

  describe('robustness (never throws)', () => {
    it('accepts $ signs, thousands separators, parentheses negatives and a BOM', () => {
      const r = parseStatement('﻿Transaction Date,Post Date,Description,Category,Type,Amount,Memo\n11/03/2025,11/04/2025,RENT,Bills,Sale,"($1,450.00)",\n');
      expect(r.format).toBe('chase_card');
      expect(r.transactions[0]?.amount).toBe(1450);
    });

    it('counts and warns about unreadable rows', () => {
      const r = parseStatement('Date,Description,Card Member,Account #,Amount\n11/03/2025,OK,A,-1,5.00\nnot a date,BAD DATE,A,-1,5.00\n11/05/2025,BAD AMOUNT,A,-1,oops\n\n11/06/2025,OK2,A,-1,6.00\n');
      expect(r.transactions).toHaveLength(2);
      expect(r.skippedRows).toBe(3);
      expect(r.warnings[0]).toMatch(/2 rows/);
    });

    it('returns a warning, not an exception, for a file with no recognizable header', () => {
      const r = parseStatement('hello world\nthis is not a bank file\n');
      expect(r.transactions).toEqual([]);
      expect(r.warnings.length).toBeGreaterThan(0);
    });

    it.each(['', '\n\n', ',,,', '"unterminated'])('survives junk input %j', (junk) => {
      expect(() => parseStatement(junk)).not.toThrow();
      expect(parseStatement(junk).transactions).toEqual([]);
    });

    it('ids are `${fileIndex}:${rowIndex}` and unique', () => {
      const r = parseStatement('Date,Description,Amount\n11/03/2025,A,1\n11/04/2025,B,2\n', 2);
      expect(r.transactions.map((t) => t.id)).toEqual(['2:1', '2:2']);
    });

    it('stamps every transaction with the detected format', () => {
      const r = parseStatement('Date,Description,Card Member,Account #,Amount\n11/03/2025,A,B,-1,1\n');
      expect(r.transactions.every((t) => t.format === 'amex')).toBe(true);
    });
  });
});
