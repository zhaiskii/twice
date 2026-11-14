/**
 * What the parser saw: "Chase card format · 214 rows · 9 recurring" + its warnings.
 *
 * DECISION(floating-banner): success floats as a bottom bar so the Continue button is
 * always on screen, whether the user picked a persona at the top or dropped a file at
 * the bottom (at 375px those are a full screen apart). Failures render inline next to
 * the dropzone instead — an error belongs where the user is looking.
 */
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { FORMAT_LABEL, plural } from '../lib/format';
import { spring } from '../lib/motion';
import type { Loaded } from '../lib/samples';
import { Alert, ArrowRight, Check } from './Icons';

export function summarize(loaded: Loaded, recurring: number) {
  const formats = [...new Set(loaded.files.map((f) => FORMAT_LABEL[f.result.format]))];
  const rows = loaded.transactions.length;
  const skipped = loaded.files.reduce((n, f) => n + f.result.skippedRows, 0);
  const warnings = loaded.files.flatMap((f) =>
    f.result.warnings.map((w) => (loaded.files.length > 1 ? `${f.name}: ${w}` : w)),
  );
  const headline = [
    loaded.files.length > 1 ? plural(loaded.files.length, 'file') : null,
    `${formats.join(' + ')} format`,
    plural(rows, 'row'),
    `${recurring} recurring`,
  ]
    .filter(Boolean)
    .join(' · ');
  return { headline, rows, skipped, warnings };
}

export function ParseBar({ loaded, recurring, onContinue }: { loaded: Loaded; recurring: number; onContinue: () => void }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const { headline, skipped, warnings } = summarize(loaded, recurring);
  const notes = [
    ...(recurring === 0
      ? ['No recurring charges found. Exports shorter than two or three months often miss them.']
      : []),
    ...warnings,
  ];

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: reduce ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduce ? 0 : 24, transition: { duration: 0.18 } }}
      transition={spring.sheet}
      className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-20 mx-auto max-w-[760px] rounded-[22px] bg-ink/95 p-2 text-white shadow-sheet backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 pl-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-bright/20 text-accent-bright">
          <Check size={15} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1 py-1">
          {/* Wraps to two lines on phones rather than hiding the row and recurring counts behind an ellipsis. */}
          <div className="text-[14px] leading-snug font-medium text-pretty tabular-nums sm:truncate">{headline}</div>
          <div className="flex items-center gap-2 truncate text-[12.5px] text-white/55">
            <span className="truncate font-mono text-[11.5px]">{loaded.files.map((f) => f.name).join(', ')}</span>
            {skipped > 0 && <span className="shrink-0">· {plural(skipped, 'row')} skipped</span>}
            {notes.length > 0 && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="press shrink-0 rounded font-medium text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
              >
                {plural(notes.length, 'note')}
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onContinue}
          disabled={loaded.transactions.length === 0}
          className="press inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-medium text-ink hover:bg-white/90 sm:px-5"
        >
          Continue
          <ArrowRight />
        </button>
      </div>
      {open && notes.length > 0 && (
        <ul className="mt-2 space-y-1.5 border-t border-white/10 px-3 pt-2.5 pb-1.5 text-[12.5px] text-white/70">
          {notes.slice(0, 6).map((n) => (
            <li key={n} className="flex gap-2">
              <Alert size={13} className="mt-[3px] shrink-0 text-white/50" />
              {n}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

/** Inline failure: wrong file type, unreadable file, or a CSV with zero transactions. */
export function ParseError({ messages, onTrySample }: { messages: string[]; onTrySample?: () => void }) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={spring.enter}
      className="mt-3 rounded-[18px] bg-danger-soft p-4 ring-1 ring-danger/15 ring-inset"
    >
      <div className="flex gap-3">
        <Alert size={16} className="mt-0.5 shrink-0 text-danger" />
        <div className="min-w-0 flex-1 text-[14px]">
          <ul className="space-y-1 text-ink">
            {messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          {onTrySample && (
            <button
              type="button"
              onClick={onTrySample}
              className="press mt-2.5 inline-flex items-center gap-1.5 rounded-full font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
            >
              Try a sample statement instead
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
