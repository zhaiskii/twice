/**
 * Reading user files in the browser. Files are read with File.text() and handed
 * to the engine in this tab — nothing is uploaded anywhere, despite the word.
 */

export const ACCEPT = '.csv,.txt,text/csv,text/plain,application/vnd.ms-excel';

// DECISION(max-size): 15 MB. A year of card activity exports at well under 1 MB; anything
// bigger is almost certainly the wrong file, and parsing it would freeze the tab.
const MAX_BYTES = 15 * 1024 * 1024;

export interface ReadResult {
  files: { name: string; text: string }[];
  /** Human sentences, one per rejected file. */
  rejected: string[];
}

function extension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

export async function readCsvFiles(list: FileList | File[]): Promise<ReadResult> {
  const files: ReadResult['files'] = [];
  const rejected: string[] = [];
  for (const file of Array.from(list)) {
    const ext = extension(file.name);
    const looksCsv = ext === 'csv' || ext === 'txt' || file.type === 'text/csv';
    if (!looksCsv) {
      rejected.push(
        ext === 'pdf'
          ? `“${file.name}” is a PDF. Twice reads CSV exports — most banks offer one under Download or Export on their website.`
          : `“${file.name}” isn't a CSV file${ext ? ` (.${ext})` : ''}.`,
      );
      continue;
    }
    if (file.size > MAX_BYTES) {
      rejected.push(`“${file.name}” is ${(file.size / 1024 / 1024).toFixed(0)} MB — too big for a statement export.`);
      continue;
    }
    try {
      files.push({ name: file.name, text: await file.text() });
    } catch {
      rejected.push(`“${file.name}” couldn't be read. Try exporting it again.`);
    }
  }
  return { files, rejected };
}
