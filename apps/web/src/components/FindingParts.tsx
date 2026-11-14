/**
 * Building blocks shared by the results FindingCard and the landing hero preview:
 * kind chip, savings figure, evidence row and source link. Keeping them in one
 * place means the hero is literally the same UI as the product, not a mock-up.
 */
import type { Finding, FindingKind, Source, Transaction } from '@twice/engine';
import { cents, formatDate, signedCents } from '../lib/format';
import { KIND_META } from '../lib/findings';
import { AnimatedNumber, AnimatedRange } from './AnimatedNumber';
import { ArrowUpRight, TrendUp } from './Icons';

/** Two tiny overlapping dots — the logo's motif — in front of every kind label. */
export function KindChip({ kind }: { kind: FindingKind }) {
  const tone =
    kind === 'price_step' ? 'bg-sunk text-ink-2' : 'bg-accent-tint text-accent-strong ring-1 ring-accent/15 ring-inset';
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium ${tone}`}>
      <span aria-hidden="true" className="relative inline-flex w-[13px]">
        <span className="size-[7px] rounded-full border-[1.5px] border-current opacity-60" />
        <span className="absolute left-[5px] size-[7px] rounded-full border-[1.5px] border-current" />
      </span>
      {KIND_META[kind].chip}
    </span>
  );
}

/** "$480–$1,320 /yr" in accent, or "+$120/yr" in ink for a price increase. */
export function SavingsFigure({ finding, size = 'md' }: { finding: Finding; size?: 'md' | 'lg' }) {
  const big = size === 'lg' ? 'text-[26px]' : 'text-[20px] sm:text-[22px]';
  if (finding.kind === 'price_step') {
    return (
      <div className="text-right">
        <div className={`heading inline-flex items-center gap-1 text-ink ${big}`}>
          <TrendUp size={16} className="text-muted" />
          <span>
            +<AnimatedNumber value={finding.annualIncrease ?? 0} />
          </span>
        </div>
        <div className="text-[12px] text-muted">more per year</div>
      </div>
    );
  }
  return (
    <div className="text-right">
      <div className={`heading whitespace-nowrap text-accent ${big}`}>
        <AnimatedRange low={finding.annualSavings.low} high={finding.annualSavings.high} />
      </div>
      <div className="text-[12px] text-muted">per year</div>
    </div>
  );
}

export function EvidenceRow({ tx, highlight = false }: { tx: Transaction; highlight?: boolean }) {
  return (
    <div
      className={`grid grid-cols-[4.75rem_minmax(0,1fr)_auto] items-baseline gap-3 rounded-md px-2 py-1.5 text-[13px] ${
        highlight ? 'bg-accent-tint' : ''
      }`}
    >
      <span className="tabular-nums text-muted">{formatDate(tx.date, { year: false })}</span>
      <span className="truncate font-mono text-[12px] tracking-[-0.01em] text-ink-2" title={tx.description}>
        {tx.description}
      </span>
      <span className="tabular-nums text-ink">{tx.amount < 0 ? signedCents(tx.amount) : cents(tx.amount)}</span>
    </div>
  );
}

export function SourceLink({ source }: { source: Source }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="group press inline-flex max-w-full items-baseline gap-1.5 rounded-md text-[13px]"
    >
      <span className="truncate font-medium text-ink underline decoration-line-2 underline-offset-[3px] group-hover:decoration-ink">
        {source.label}
      </span>
      <ArrowUpRight size={12} className="relative top-[1px] text-muted group-hover:text-ink" />
      <span className="shrink-0 text-muted">checked {formatDate(source.checkedOn)}</span>
    </a>
  );
}
