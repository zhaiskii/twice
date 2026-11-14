/**
 * Landing hero visual: a slice of a real sample statement, a highlighter sweep over
 * the rows that matter, then the finding card that the engine produced from them.
 *
 * DECISION(hero-motion): this is the one place with a choreographed sequence
 * (statement → highlight → card → number roll). It plays once per page load and
 * explains the product in ~2s without words — "explanation" is the purpose, so it
 * may run longer than UI motion. Nothing here is typed in: rows and card come from
 * analyze() on a bundled persona (see lib/samples.ts pickHeroSample).
 */
import type { Transaction } from '@twice/engine';
import { motion, useReducedMotion } from 'motion/react';
import { useMemo } from 'react';
import { FORMAT_LABEL, formatDate, signedCents } from '../lib/format';
import { EASE_IN_OUT, spring } from '../lib/motion';
import { firstName, type HeroSample } from '../lib/samples';
import { AnimatedRange } from './AnimatedNumber';
import { KindChip, SourceLink } from './FindingParts';
import { ArrowRight } from './Icons';

const ROWS = 6;

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000;
}

/** Up to two evidence rows (distinct merchants) + the nearest ordinary charges, newest first. */
function pickRows(sample: HeroSample): { tx: Transaction; evidence: boolean }[] {
  const ev = new Set(sample.finding.evidence);
  const all = sample.loaded.transactions;
  const picked: Transaction[] = [];
  const seen = new Set<string>();
  for (const t of all) {
    if (!ev.has(t.id)) continue;
    const key = t.description.split(/\s+/)[0] ?? t.description;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(t);
    if (picked.length === 2) break;
  }
  const anchor = picked[0] ? dayNumber(picked[0].date) : 0;
  const fillers = all
    .filter((t) => !ev.has(t.id) && t.amount > 0)
    .sort((a, b) => Math.abs(dayNumber(a.date) - anchor) - Math.abs(dayNumber(b.date) - anchor))
    .slice(0, ROWS - picked.length);
  return [...picked, ...fillers]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map((tx) => ({ tx, evidence: ev.has(tx.id) }));
}

export function HeroPreview({ sample, onOpen }: { sample: HeroSample | null; onOpen: () => void }) {
  const reduce = useReducedMotion();
  const rows = useMemo(() => (sample ? pickRows(sample) : []), [sample]);

  if (!sample) return <HeroSkeleton />;
  const { finding, persona } = sample;
  const source = finding.sources[0];

  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <motion.p
        className="mb-3 flex items-center gap-2 pl-1 text-[12.5px] text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <span className="relative flex size-2" aria-hidden="true">
          <span className="absolute inset-0 animate-ping rounded-full bg-accent-bright opacity-40 motion-reduce:hidden" />
          <span className="relative size-2 rounded-full bg-accent" />
        </span>
        Computed in your browser from {firstName(persona)}'s sample statement
      </motion.p>

      {/* Back layer: the raw statement */}
      <motion.div
        className="mr-6 rounded-[18px] bg-card/90 p-2 shadow-card sm:mr-14"
        initial={{ opacity: 0, y: reduce ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.enter, delay: 0.1 }}
      >
        <div className="flex items-center justify-between px-2.5 pt-1.5 pb-2">
          <span className="font-mono text-[11.5px] text-muted">{persona.file}</span>
          <span className="text-[11.5px] text-faint">{FORMAT_LABEL[persona.format]}</span>
        </div>
        <ul>
          {rows.map(({ tx, evidence }, i) => (
            <motion.li
              key={tx.id}
              className="relative grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-baseline gap-3 rounded-lg px-2.5 py-[7px] text-[12.5px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.045, duration: 0.3 }}
            >
              {evidence && (
                // Highlighter sweep: clip-path reveal left→right, like a marker stroke.
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-lg bg-accent-soft"
                  initial={{ clipPath: reduce ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
                  animate={{ clipPath: 'inset(0 0% 0 0)' }}
                  transition={{ delay: 0.8 + i * 0.12, duration: 0.55, ease: EASE_IN_OUT }}
                />
              )}
              <span className="relative tabular-nums text-muted">{formatDate(tx.date, { year: false })}</span>
              <span
                className={`relative truncate font-mono text-[11.5px] ${evidence ? 'text-ink' : 'text-ink-2/70'}`}
              >
                {tx.description}
              </span>
              <span className={`relative tabular-nums ${evidence ? 'font-medium text-ink' : 'text-muted'}`}>
                {signedCents(tx.amount)}
              </span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Front layer: what the engine found */}
      <motion.div
        className="relative -mt-16 ml-5 rounded-[20px] bg-card p-5 shadow-lift sm:-mt-20 sm:ml-14"
        initial={{ opacity: 0, y: reduce ? 0 : 28, scale: reduce ? 1 : 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...spring.sheet, delay: 1.25 }}
      >
        <div className="flex items-start justify-between gap-3">
          <KindChip kind={finding.kind} />
          <div className="text-right">
            <div className="heading whitespace-nowrap text-[24px] text-accent">
              <AnimatedRange
                low={finding.annualSavings.low}
                high={finding.annualSavings.high}
                from={0}
                duration={1.1}
                delay={1.45}
              />
            </div>
            <div className="text-[12px] text-muted">per year</div>
          </div>
        </div>
        <h3 className="heading mt-3 text-[16.5px] text-ink">{finding.title}</h3>
        <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-ink-2">{finding.detail}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line pt-3.5">
          {source ? <SourceLink source={source} /> : <span />}
          <button
            type="button"
            onClick={onOpen}
            className="press -mr-1 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink hover:bg-ink/[0.05]"
          >
            See all of {firstName(persona)}'s results
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/** Shown only if no sample is bundled — neutral bars, never a fabricated number. */
function HeroSkeleton() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]" aria-hidden="true">
      <div className="mr-6 space-y-2.5 rounded-[18px] bg-card/90 p-5 shadow-card sm:mr-14">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <span className="h-3 w-10 rounded bg-sunk" />
            <span className="h-3 flex-1 rounded bg-sunk" />
            <span className="h-3 w-12 rounded bg-sunk" />
          </div>
        ))}
      </div>
      <div className="relative -mt-14 ml-5 space-y-3 rounded-[20px] bg-card p-5 shadow-lift sm:ml-14">
        <span className="block h-5 w-28 rounded-full bg-accent-tint" />
        <span className="block h-4 w-3/4 rounded bg-sunk" />
        <span className="block h-3 w-full rounded bg-sunk" />
      </div>
    </div>
  );
}
