/**
 * Switch kit (bottom sheet): the finding's ordered steps as checkboxes. Progress is
 * saved in this browser (lib/storage) and feeds the Bill Detox tracker.
 *
 * DECISION(kit-keys): steps are keyed by title, not index, so a data update that
 * inserts a step doesn't shift everyone's saved checkmarks onto the wrong step.
 */
import type { Finding } from '@twice/engine';
import { motion } from 'motion/react';
import { Button } from './Button';
import { AnimatedRange } from './AnimatedNumber';
import { Dialog, DialogHeader } from './Dialog';
import { SourceLink } from './FindingParts';
import { ArrowUpRight } from './Icons';
import { cents } from '../lib/format';

interface Props {
  finding: Finding;
  done: string[];
  onToggle: (stepTitle: string) => void;
  onClose: () => void;
}

export function KitSheet({ finding, done, onToggle, onClose }: Props) {
  const total = finding.kit.length;
  const count = finding.kit.filter((s) => done.includes(s.title)).length;
  const saving = finding.annualSavings;

  return (
    <Dialog variant="sheet" onClose={onClose} labelledBy="kit-title">
      <DialogHeader id="kit-title" eyebrow="Switch kit" title={finding.title} onClose={onClose}>
        {saving.high > 0 && (
          <p className="mt-1.5 text-[14px] text-muted">
            Worth{' '}
            <span className="font-semibold text-accent">
              <AnimatedRange low={saving.low} high={saving.high} />
              /yr
            </span>{' '}
            once it's done.
          </p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-sunk" aria-hidden="true">
            <motion.span
              className="absolute inset-0 origin-left rounded-full bg-accent"
              initial={false}
              animate={{ scaleX: total ? count / total : 0 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
            />
          </span>
          <span className="text-[12.5px] tabular-nums text-muted" aria-live="polite">
            {count} of {total} done
          </span>
        </div>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 sm:px-6">
        {finding.alternatives && finding.alternatives[0] && (
          <a
            href={finding.alternatives[0].url}
            target="_blank"
            rel="noreferrer"
            className="press mb-3 flex items-center justify-between gap-3 rounded-2xl bg-accent-tint px-4 py-3 ring-1 ring-accent/15 ring-inset hover:bg-accent-soft"
          >
            <span className="min-w-0">
              <span className="block text-[12px] text-accent-strong">Cheapest on your network</span>
              <span className="block truncate text-[14px] font-medium text-ink">
                {finding.alternatives[0].brand} · {finding.alternatives[0].name}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-[14px] font-medium tabular-nums text-ink">
              {cents(finding.alternatives[0].monthlyTotal)}/mo
              <ArrowUpRight size={14} className="text-muted" />
            </span>
          </a>
        )}

        <ol className="space-y-1.5">
          {finding.kit.map((step, i) => {
            const on = done.includes(step.title);
            return (
              <li key={step.title}>
                <label
                  className={`press flex cursor-pointer gap-3.5 rounded-2xl p-3.5 select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-accent ${
                    on ? 'bg-paper' : 'hover:bg-paper'
                  }`}
                >
                  {/* Name = the step title, description = the body, so a screen reader doesn't read a paragraph per checkbox. */}
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => onToggle(step.title)}
                    aria-labelledby={`kit-step-${i}`}
                    aria-describedby={`kit-step-${i}-body`}
                  />
                  <CheckCircle on={on} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-[12px] tabular-nums text-faint">{i + 1}</span>
                      <span
                        id={`kit-step-${i}`}
                        className={`text-[15px] font-medium tracking-[-0.01em] transition-colors duration-200 ${
                          on ? 'text-muted' : 'text-ink'
                        }`}
                      >
                        {step.title}
                      </span>
                    </span>
                    <span id={`kit-step-${i}-body`} className="mt-0.5 block text-[13.5px] leading-relaxed text-muted">
                      {step.body}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ol>

        {finding.sources.length > 0 && (
          <div className="mt-4 space-y-1 border-t border-line px-1 pt-3.5">
            {finding.sources.map((s) => (
              <SourceLink key={s.url + s.label} source={s} />
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-5 py-3.5 sm:px-6">
        <p className="text-[12.5px] leading-snug text-muted">Saved in this browser. Come back any time.</p>
        <Button variant="primary" size="sm" onClick={onClose}>
          {count === total && total > 0 ? 'All done' : 'Done for now'}
        </Button>
      </div>
    </Dialog>
  );
}

/** Checkbox glyph: fills, then the check draws itself (pathLength) — feedback for the tap. */
function CheckCircle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-px flex size-[22px] shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow] duration-200 ${
        on ? 'bg-accent' : 'bg-card shadow-[inset_0_0_0_1.5px_var(--color-line-2)]'
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <motion.path
          d="M3.5 8.5l3 3 6-7"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        />
      </svg>
    </span>
  );
}
