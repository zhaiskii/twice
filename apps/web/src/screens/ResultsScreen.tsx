/**
 * Screen 4 — Results. Left (sticky on desktop): the total, what it was computed from,
 * the way to edit it, and Bill Detox. Right: finding cards grouped by kind.
 *
 * DECISION(results-motion): the total rolls up from $0 once on arrival (the "aha",
 * rare → allowed ~1.1s). After that, every edit rolls from the on-screen value, cards
 * that appear/disappear fade while siblings glide (layout="position", popLayout) —
 * motion here explains *what changed* when the statement is edited.
 */
import type { Analysis, Finding, RecurringCharge, Transaction } from '@twice/engine';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { AnimatedNumber, AnimatedRange } from '../components/AnimatedNumber';
import { Button } from '../components/Button';
import { DetoxTracker } from '../components/DetoxTracker';
import { FindingCard } from '../components/FindingCard';
import { Check, Refresh, Table } from '../components/Icons';
import { cents, FORMAT_LABEL, money, plural } from '../lib/format';
import { groupFindings, hasSavings, isSaving, KIND_META } from '../lib/findings';
import { spring, STAGGER } from '../lib/motion';
import { firstName, type Loaded } from '../lib/samples';

interface Props {
  analysis: Analysis;
  loaded: Loaded;
  txById: Map<string, Transaction>;
  rowCount: number;
  doneFor: (id: string) => number;
  plus: boolean;
  freeKitId: string | null;
  onOpenKit: (f: Finding) => void;
  onOpenStatement: () => void;
  onEditAnswers: (() => void) | null;
  onStartOver: () => void;
}

function sourceLabel(loaded: Loaded): string {
  const formats = [...new Set(loaded.files.map((f) => FORMAT_LABEL[f.result.format]))].join(' + ');
  if (loaded.source.kind === 'persona') return `${firstName(loaded.source.persona)}'s sample · ${formats}`;
  return `${plural(loaded.files.length, 'file')} · ${formats}`;
}

export function ResultsScreen(props: Props) {
  const { analysis, loaded, txById, rowCount, doneFor, plus, freeKitId, onOpenKit, onOpenStatement, onEditAnswers, onStartOver } =
    props;
  const reduce = useReducedMotion();
  const groups = groupFindings(analysis.findings);
  const savings = hasSavings(analysis);
  const savingCount = analysis.findings.filter(isSaving).length;
  let cardIndex = 0;

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6 pb-10 sm:px-6 sm:pt-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-10">
        {/* DECISION(sticky-aside): the summary stays in view while cards scroll, so an edit's
            effect on the total is always visible. It scrolls internally if taller than the
            viewport (short laptop screens) instead of hiding the tracker's bottom. */}
        <aside className="lg:sticky lg:top-20 lg:-m-2 lg:max-h-[calc(100svh-6rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:p-2 lg:[scrollbar-width:thin]">
          <div className="space-y-4">
            <motion.section
              aria-labelledby="total-title"
              initial={{ opacity: 0, y: reduce ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring.enter}
              className="rounded-[24px] bg-card p-6 shadow-card"
            >
              <p className="text-[12.5px] text-muted">{sourceLabel(loaded)}</p>
              {savings ? (
                <>
                  <h1 id="total-title" className="mt-5 text-[14px] font-medium text-ink-2">
                    You could keep
                  </h1>
                  {/* DECISION(total-size): sized so a typical "$1,644–$1,884 /yr" fits one line in the 400px aside and at 375px; bigger ranges wrap at the en dash. */}
                  <div className="display mt-1 text-[clamp(2rem,9.6vw,2.6rem)] text-ink">
                    <AnimatedRange
                      low={analysis.totals.annualLow}
                      high={analysis.totals.annualHigh}
                      from={0}
                      duration={1.1}
                      delay={0.15}
                    />
                    <span className="ml-1.5 text-[18px] font-medium tracking-[-0.01em] text-muted">/yr</span>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                    From {plural(savingCount, 'finding')}, counted once per service. The low end is the cautious case.
                  </p>
                </>
              ) : (
                <>
                  <span className="mt-5 flex size-11 items-center justify-center rounded-full bg-accent text-white">
                    <Check size={20} strokeWidth={2.2} />
                  </span>
                  <h1 id="total-title" className="heading mt-4 text-[28px]">
                    You're already on a good deal.
                  </h1>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">
                    Nothing in this statement is paid for twice. That's a real result, not a missing one — here is
                    everything we checked.
                  </p>
                </>
              )}

              <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line">
                <div className="bg-paper px-4 py-3">
                  <dt className="text-[12px] text-muted">Recurring spend</dt>
                  <dd className="mt-0.5 text-[16px] font-semibold tracking-[-0.01em] text-ink">
                    <AnimatedNumber value={analysis.totals.recurringAnnual} />
                    <span className="text-[12px] font-medium text-muted">/yr</span>
                  </dd>
                </div>
                <div className="bg-paper px-4 py-3">
                  <dt className="text-[12px] text-muted">Recurring charges</dt>
                  <dd className="mt-0.5 text-[16px] font-semibold tracking-[-0.01em] tabular-nums text-ink">
                    {analysis.recurring.length}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="primary" size="sm" onClick={onOpenStatement}>
                  <Table />
                  Edit statement
                  <span className="text-white/55 tabular-nums">{rowCount}</span>
                </Button>
                {onEditAnswers && (
                  <Button variant="ghost" size="sm" onClick={onEditAnswers}>
                    Change answers
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onStartOver}>
                  <Refresh />
                  Start over
                </Button>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-faint">
                Delete or edit any row and the numbers recompute here, in your browser.
              </p>
            </motion.section>

            <DetoxTracker findings={analysis.findings} doneFor={doneFor} plus={plus} freeKitId={freeKitId} onOpenKit={onOpenKit} />
          </div>
        </aside>

        <div className="min-w-0">
          <LayoutGroup>
            {!savings && <WhatWeChecked recurring={analysis.recurring} />}
            {groups.map((g) => (
              <motion.section
                key={g.kind}
                layout="position"
                transition={spring.layout}
                aria-labelledby={`group-${g.kind}`}
                className="mb-10 last:mb-0"
              >
                <header className="mb-4 px-1">
                  <div className="flex items-baseline gap-2.5">
                    <h2 id={`group-${g.kind}`} className="heading text-[20px]">
                      {KIND_META[g.kind].group}
                    </h2>
                    <span className="text-[13px] tabular-nums text-faint">{g.findings.length}</span>
                  </div>
                  <p className="mt-1 text-[14px] text-muted">{KIND_META[g.kind].blurb}</p>
                </header>
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {g.findings.map((f) => {
                      const i = cardIndex++;
                      return (
                        <motion.div
                          key={f.id}
                          layout="position"
                          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                          // Stagger lives on the entrance only; layout glides must never wait.
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: { ...spring.enter, delay: 0.1 + Math.min(i, 8) * STAGGER },
                          }}
                          exit={{ opacity: 0, scale: reduce ? 1 : 0.98, transition: { duration: 0.18 } }}
                          transition={{ layout: spring.layout }}
                        >
                          <FindingCard
                            finding={f}
                            txById={txById}
                            kitDone={doneFor(f.id)}
                            kitLocked={!plus && freeKitId !== null && freeKitId !== f.id}
                            onOpenKit={() => onOpenKit(f)}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.section>
            ))}
          </LayoutGroup>
        </div>
      </div>
    </div>
  );
}

const CADENCE: Record<RecurringCharge['cadence'], string> = { weekly: '/wk', monthly: '/mo', annual: '/yr' };

/** The clean-persona state: show the work, so "nothing found" reads as checked, not broken. */
function WhatWeChecked({ recurring }: { recurring: RecurringCharge[] }) {
  const wireless = recurring.filter((r) => r.category === 'wireless');
  const checks = [
    'No service you pay for directly is included in a plan, card or membership we know about.',
    'No two services doing the same job (music, cloud storage, delivery, 3+ video apps).',
    wireless.length > 0
      ? `Your phone plan (${wireless.map((w) => w.merchantName).join(', ')}) isn't one of the big-three postpaid carriers we compare against.`
      : 'No Verizon, AT&T or T-Mobile bill to compare against cheaper plans on the same network.',
  ];
  return (
    <section aria-labelledby="checked-title" className="mb-10 rounded-[22px] bg-card p-5 shadow-card sm:p-6">
      <h2 id="checked-title" className="heading text-[20px]">
        What we checked
      </h2>
      <ul className="mt-4 space-y-2.5">
        {checks.map((c) => (
          <li key={c} className="flex gap-3 text-[14px] text-ink-2">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent">
              <Check size={11} strokeWidth={2.4} />
            </span>
            {c}
          </li>
        ))}
      </ul>
      {recurring.length > 0 && (
        <>
          <h3 className="eyebrow mt-6 mb-2">Recurring charges we found</h3>
          <ul className="divide-y divide-line rounded-xl ring-1 ring-line">
            {recurring.map((r) => (
              <li key={r.merchantId} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[14px]">
                <span className="truncate text-ink">{r.merchantName}</span>
                <span className="shrink-0 tabular-nums text-ink-2">
                  {cents(r.currentAmount)}
                  <span className="text-muted">{CADENCE[r.cadence]}</span>
                  <span className="ml-2 text-[12.5px] text-faint">{money(r.annualCost)}/yr</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
