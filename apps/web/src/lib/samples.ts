/**
 * Sample statements (synthetic personas) for the no-login jury demo, plus the
 * loaders that turn CSV text into engine input. Uploads go through the same
 * `parseFiles` path, so a sample is never special-cased downstream.
 */
import { analyze, parseStatement, personas } from '@twice/engine';
import type { Finding, ParseResult, Persona, Transaction } from '@twice/engine';

// DECISION(sample-bundling): persona CSVs are inlined into the bundle with Vite `?raw`
// (eager glob). They are ~15 KB each, the hero preview needs one at first paint, and
// it keeps "works offline / no server" literally true. AGENT: the glob is relative to
// this file; if fixtures move, update the path. personas.json lists the file names.
const rawFiles = import.meta.glob('../../../../packages/engine/fixtures/*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const sampleText: Record<string, string> = Object.fromEntries(
  Object.entries(rawFiles).map(([path, text]) => [path.slice(path.lastIndexOf('/') + 1), text]),
);

export interface ParsedFile {
  name: string;
  result: ParseResult;
}

export interface Loaded {
  /** What the user picked; drives copy like "Prefilled from Maya's sample". */
  source: { kind: 'persona'; persona: Persona } | { kind: 'upload' };
  files: ParsedFile[];
  transactions: Transaction[];
}

export const samplePersonas: Persona[] = personas;

export function hasSample(persona: Persona): boolean {
  return persona.file in sampleText;
}

/** Newest first, stable. The statement drawer keeps this order while you edit. */
function byDateDesc(a: Transaction, b: Transaction): number {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

export function loadPersona(persona: Persona): Loaded | null {
  const text = sampleText[persona.file];
  if (text === undefined) return null;
  const result = parseStatement(text, 0);
  return {
    source: { kind: 'persona', persona },
    files: [{ name: persona.file, result }],
    transactions: [...result.transactions].sort(byDateDesc),
  };
}

/** Several uploaded CSVs → one merged statement. fileIndex keeps transaction ids unique. */
export function parseFiles(files: { name: string; text: string }[]): Loaded {
  const parsed = files.map((f, i) => ({ name: f.name, result: parseStatement(f.text, i) }));
  return {
    source: { kind: 'upload' },
    files: parsed,
    transactions: parsed.flatMap((p) => p.result.transactions).sort(byDateDesc),
  };
}

export interface HeroSample {
  persona: Persona;
  loaded: Loaded;
  finding: Finding;
}

// DECISION(hero-is-live): the landing preview card is computed from a bundled sample
// on page load, never typed in. "Paying twice" findings are the product's core idea, so
// prefer them; fall back to the biggest saving of any kind. Returns null while the
// engine/fixtures are missing, and the hero shows a neutral skeleton instead of a
// made-up number.
export function pickHeroSample(): HeroSample | null {
  let best: HeroSample | null = null;
  let bestScore = -1;
  for (const persona of samplePersonas) {
    const loaded = loadPersona(persona);
    if (!loaded) continue;
    const analysis = analyze(loaded.transactions, persona.profile);
    for (const finding of analysis.findings) {
      if (finding.kind === 'price_step' || finding.annualSavings.high <= 0) continue;
      const score = finding.annualSavings.high + (finding.kind === 'paying_twice' ? 100_000 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = { persona, loaded, finding };
      }
    }
  }
  return best;
}

/** First name only, for copy like "Maya's sample". */
export function firstName(persona: Persona): string {
  return persona.name.split(/[\s,·—-]/)[0] ?? persona.name;
}
