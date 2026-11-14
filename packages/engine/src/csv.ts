/**
 * Owns: turning CSV text into rows of strings (RFC 4180). Knows nothing about
 * banks, dates or amounts — see formats.ts for that.
 *
 * Handles quoted fields, "" escapes, commas/newlines inside quotes, CRLF / LF /
 * lone CR line ends, a leading UTF-8 BOM and a missing trailing newline.
 * Never throws: an unterminated quote simply runs to the end of the text.
 */

const BOM = 0xfeff;

export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === BOM ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c !== '"') field += c;
      else if (src[i + 1] === '"') {
        field += '"';
        i++;
      } else inQuotes = false;
    } else if (c === '"' && field === '') {
      // DECISION(csv-quote-start): a quote only opens a quoted field at the very start of a
      // field. A stray quote mid-field (`5" pipe`) is literal text — real bank exports do this.
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  // Last row without a trailing newline. A trailing newline leaves nothing pending, so
  // it does not produce a phantom empty row.
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
