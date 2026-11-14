/**
 * One finding, fully shown: what, how much, the statement rows that prove it, the
 * rule that fired, its assumptions and sources, and the switch kit entry point.
 *
 * DECISION(show-the-work): evidence, rule and sources are visible by default, not
 * hidden behind "details". A judge should be able to verify a card without clicking;
 * only the long tail of evidence rows (beyond 3) is collapsed.
 */
import type { Finding, Transaction } from '@twice/engine';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useMemo, useState } from 'react';
import { cents, plural } from '../lib/format';
import { EASE_OUT } from '../lib/motion';
import { ArrowRight, ArrowUpRight, Check, Lock } from './Icons';
import { EvidenceRow, KindChip, SavingsFigure, SourceLink } from './FindingParts';

const PREVIEW_ROWS = 3;

interface Props {
  finding: Finding;
  txById: Map<string, Transaction>;
  kitDone: number;
  /** Kit needs Twice Plus (a second kit on the free tier). */
  kitLocked: boolean;
  onOpenKit: () => void;
}

export function FindingCard({ finding, txById, kitDone, kitLocked, onOpenKit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const titleId = useId();
  const evidence = useMemo(
    () =>
      finding.evidence
        .map((id) => txById.get(id))
        .filter((t): t is Transaction => t !== undefined)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [finding.evidence, txById],
  );
  const head = evidence.slice(0, PREVIEW_ROWS);
  const tail = evidence.slice(PREVIEW_ROWS);
  const kitTotal = finding.kit.length;
  const kitComplete = kitTotal > 0 && kitDone >= kitTotal;

  return (
    <article aria-labelledby={titleId} className="rounded-[20px] bg-card shadow-card">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <KindChip kind={finding.kind} />
            {finding.confidence === 'medium' && (
              <span className="inline-flex h-6 items-center rounded-full bg-sunk px-2.5 text-[12px] font-medium text-ink-2">
                Estimate
              </span>
            )}
          </div>
          <SavingsFigure finding={finding} />
        </div>

        <h3 id={titleId} className="heading mt-3 text-[17px] text-ink sm:text-[18px]">
          {finding.title}
        </h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{finding.detail}</p>

        {finding.alternatives && finding.alternatives.length > 0 && (
          <div className="mt-4">
            <div className="eyebrow mb-2">Same network, cheaper plans</div>
            <ul className="divide-y divide-line overflow-hidden rounded-xl ring-1 ring-line">
              {finding.alternatives.map((alt, i) => (
                <li key={alt.planId}>
                  <a
                    href={alt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 bg-card px-3.5 py-2.5 transition-colors duration-150 hover:bg-paper"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-medium text-ink">{alt.brand}</span>
                        {i === 0 && (
                          <span className="rounded-full bg-accent-tint px-1.5 py-px text-[11px] font-medium text-accent-strong">
                            Cheapest
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[12.5px] text-muted">{alt.name}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[14px] font-medium tabular-nums text-ink">{cents(alt.monthlyTotal)}</span>
                      <span className="text-[12px] text-muted">/mo</span>
                    </div>
                    <ArrowUpRight size={14} className="text-faint transition-colors group-hover:text-ink" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {evidence.length > 0 && (
          <div className="mt-5">
            <div className="mb-1.5 flex items-baseline justify-between px-2">
              <span className="eyebrow">From your statement</span>
              <span className="text-[12px] text-muted">{plural(evidence.length, 'charge')}</span>
            </div>
            <div className="-mx-0.5 rounded-xl bg-paper/70 py-1 ring-1 ring-line/70">
              {head.map((tx) => (
                <EvidenceRow key={tx.id} tx={tx} />
              ))}
              <AnimatePresence initial={false}>
                {expanded && tail.length > 0 && (
                  <motion.div
                    key="tail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.26, ease: EASE_OUT }}
                    className="overflow-hidden"
                  >
                    {tail.map((tx) => (
                      <EvidenceRow key={tx.id} tx={tx} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {tail.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  className="press mx-1 mt-0.5 rounded-md px-1 py-1 text-[12.5px] font-medium text-muted hover:text-ink"
                >
                  {expanded ? 'Show fewer' : `Show ${tail.length} more`}
                </button>
              )}
            </div>
          </div>
        )}

        <dl className="mt-5 grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-x-4 sm:gap-y-2.5">
          <dt className="eyebrow sm:pt-px">Rule</dt>
          <dd className="-mt-2 text-ink-2 sm:mt-0">{finding.rule}</dd>
          {finding.assumptions.length > 0 && (
            <>
              <dt className="eyebrow sm:pt-px">Assumes</dt>
              <dd className="-mt-2 sm:mt-0">
                <ul className="space-y-1 text-ink-2">
                  {finding.assumptions.map((a) => (
                    <li key={a} className="flex gap-2">
                      <span aria-hidden="true" className="mt-[9px] size-1 shrink-0 rounded-full bg-faint" />
                      {a}
                    </li>
                  ))}
                </ul>
              </dd>
            </>
          )}
          {finding.sources.length > 0 && (
            <>
              <dt className="eyebrow sm:pt-px">Sources</dt>
              <dd className="-mt-2 flex min-w-0 flex-col items-start gap-1 sm:mt-0">
                {finding.sources.map((s) => (
                  <SourceLink key={s.url + s.label} source={s} />
                ))}
              </dd>
            </>
          )}
        </dl>
      </div>

      {kitTotal > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5 sm:px-6">
          <KitProgress done={kitDone} total={kitTotal} />
          <button
            type="button"
            onClick={onOpenKit}
            className={`press inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium ${
              kitComplete
                ? 'bg-accent-tint text-accent-strong hover:bg-accent-soft'
                : 'bg-ink text-white shadow-button hover:bg-[#2a2d28]'
            }`}
          >
            {kitLocked && <Lock size={14} className="opacity-80" />}
            {kitComplete ? 'Review switch kit' : kitDone > 0 ? 'Continue switch kit' : 'Open switch kit'}
            {!kitLocked && <ArrowRight size={14} />}
          </button>
        </div>
      )}
    </article>
  );
}

function KitProgress({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(1, done / total);
  return (
    <div className="flex min-w-0 items-center gap-2.5 text-[12.5px] text-muted">
      <span className="relative h-1.5 w-14 overflow-hidden rounded-full bg-sunk sm:w-20" aria-hidden="true">
        <motion.span
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-accent"
          initial={false}
          animate={{ scaleX: pct }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
        />
      </span>
      <span className="tabular-nums">
        {done >= total ? (
          <span className="inline-flex items-center gap-1 text-accent-strong">
            <Check size={13} /> Done
          </span>
        ) : (
          `${done} of ${total} steps`
        )}
      </span>
    </div>
  );
}
