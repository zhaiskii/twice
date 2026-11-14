/**
 * Bill Detox — progress across every switch kit, and the reason to come back.
 *
 * DECISION(detox-hint): the hint is driven by which kit is in progress, because the
 * real-world waits are what bring people back: transfer PINs expire in 4–7 days
 * (finish the port), and perks need one billing cycle of overlap (come back after the
 * next bill). We never invent a reminder the user can't act on.
 */
import type { Finding } from '@twice/engine';
import { motion } from 'motion/react';
import { Check, Lock } from './Icons';

interface Props {
  findings: Finding[];
  doneFor: (id: string) => number;
  plus: boolean;
  freeKitId: string | null;
  onOpenKit: (f: Finding) => void;
}

function hintFor(findings: Finding[], doneFor: (id: string) => number): string {
  const started = findings.filter((f) => {
    const d = doneFor(f.id);
    return d > 0 && d < f.kit.length;
  });
  const total = findings.reduce((n, f) => n + f.kit.length, 0);
  const done = findings.reduce((n, f) => n + Math.min(doneFor(f.id), f.kit.length), 0);
  if (total > 0 && done >= total) return 'Every switch is done. Re-scan next month to catch the next price change.';
  if (started.some((f) => f.kind === 'phone_switch'))
    return 'Transfer PINs expire in 4–7 days. Come back to finish the port before yours does.';
  if (started.some((f) => f.kind === 'paying_twice'))
    return 'Keep both until your next bill — a perk needs one billing cycle of overlap before you cancel.';
  if (started.length > 0) return 'Pick up where you left off. Your checkboxes are saved in this browser.';
  return 'Start with the biggest saving. One switch a week is a 30-day Bill Detox.';
}

export function DetoxTracker({ findings, doneFor, plus, freeKitId, onOpenKit }: Props) {
  const withKits = findings.filter((f) => f.kit.length > 0);
  if (withKits.length === 0) return null;
  const total = withKits.reduce((n, f) => n + f.kit.length, 0);
  const done = withKits.reduce((n, f) => n + Math.min(doneFor(f.id), f.kit.length), 0);

  return (
    <section aria-labelledby="detox-title" className="rounded-[22px] bg-card p-5 shadow-card sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="detox-title" className="heading text-[17px]">
          Bill Detox
        </h2>
        <span className="text-[13px] tabular-nums text-muted">
          {done} of {total} steps
        </span>
      </div>

      <div className="mt-3 flex h-2 gap-[3px]" aria-hidden="true">
        {withKits.map((f) => {
          const pct = Math.min(1, doneFor(f.id) / f.kit.length);
          return (
            <span
              key={f.id}
              className="relative h-full overflow-hidden rounded-full bg-sunk"
              style={{ flexGrow: f.kit.length }}
            >
              <motion.span
                className="absolute inset-0 origin-left rounded-full bg-accent"
                initial={false}
                animate={{ scaleX: pct }}
                transition={{ type: 'spring', duration: 0.6, bounce: 0 }}
              />
            </span>
          );
        })}
      </div>

      <ul className="mt-4 space-y-0.5">
        {withKits.map((f) => {
          const d = Math.min(doneFor(f.id), f.kit.length);
          const complete = d >= f.kit.length;
          const locked = !plus && freeKitId !== null && freeKitId !== f.id;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => onOpenKit(f)}
                className="press -mx-2 flex w-[calc(100%+16px)] items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-paper"
              >
                <span
                  aria-hidden="true"
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-200 ${
                    complete ? 'bg-accent' : d > 0 ? 'bg-accent/15 ring-[1.5px] ring-accent ring-inset' : 'ring-[1.5px] ring-line-2 ring-inset'
                  }`}
                >
                  {complete && <Check size={11} strokeWidth={2.6} />}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-2">{f.title}</span>
                {locked ? (
                  <span className="shrink-0 text-faint">
                    <Lock size={13} />
                    <span className="sr-only">Needs Twice Plus</span>
                  </span>
                ) : (
                  <span className="shrink-0 text-[12px] tabular-nums text-muted">
                    {d}/{f.kit.length}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 rounded-xl bg-accent-tint px-3.5 py-3 text-[13px] leading-relaxed text-accent-strong">
        {hintFor(withKits, doneFor)}
      </p>
      <p className="mt-3 text-[12px] text-muted">
        {plus ? 'Twice Plus (demo) — every kit unlocked.' : 'Free: every finding + one switch kit.'}
      </p>
    </section>
  );
}
