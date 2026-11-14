import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv';

describe('parseCsv', () => {
  it('splits simple rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });

  it('handles quoted fields with commas and escaped quotes', () => {
    expect(parseCsv('"Smith, J","He said ""hi""",x\n')).toEqual([['Smith, J', 'He said "hi"', 'x']]);
  });

  it('keeps newlines inside quoted fields', () => {
    expect(parseCsv('"line1\nline2",b\nc,d\n')).toEqual([['line1\nline2', 'b'], ['c', 'd']]);
  });

  it('accepts CRLF, LF and lone CR line endings', () => {
    expect(parseCsv('a,b\r\nc,d\r\n')).toEqual([['a', 'b'], ['c', 'd']]);
    expect(parseCsv('a,b\rc,d')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('strips a UTF-8 BOM', () => {
    expect(parseCsv('﻿Date,Amount\n1,2')[0]).toEqual(['Date', 'Amount']);
  });

  it('does not invent a row for a trailing newline, but keeps blank lines in the middle', () => {
    expect(parseCsv('a\n')).toEqual([['a']]);
    expect(parseCsv('a\n\nb\n')).toEqual([['a'], [''], ['b']]);
  });

  it('keeps empty fields, including a trailing one', () => {
    expect(parseCsv('a,,c,')).toEqual([['a', '', 'c', '']]);
  });

  it('treats a mid-field quote as literal text', () => {
    expect(parseCsv('5" pipe,x')).toEqual([['5" pipe', 'x']]);
  });

  it('never throws on an unterminated quote', () => {
    expect(parseCsv('a,"oops\nb,c')).toEqual([['a', 'oops\nb,c']]);
  });

  it('returns no rows for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });
});
