/**
 * Screen 3 — Quiz. Only the questions the engine says matter (analysis.needs with
 * an empty profile), prefilled from the persona. Every answer re-runs analyze(), and
 * the live estimate in the bar moves — answers visibly change the result.
 */
import type { Profile, Question } from '@twice/engine';
import { motion, useReducedMotion } from 'motion/react';
import { AnimatedRange } from '../components/AnimatedNumber';
import { Button } from '../components/Button';
import { ArrowLeft, ArrowRight, Check, Minus, Plus } from '../components/Icons';
import { spring, STAGGER } from '../lib/motion';

interface Props {
  questions: Question[];
  answers: Profile;
  onChange: (next: Profile) => void;
  estimate: { low: number; high: number };
  /** "Maya" when the answers were prefilled from a sample. */
  prefilledFrom: string | null;
  onSubmit: () => void;
  onSkip: () => void;
  onBack: () => void;
}

// DECISION(lines-range): 1–10 lines. Family plans top out around 10; beyond that the
// per-line math in plans.json isn't meaningful.
const MIN_LINES = 1;
const MAX_LINES = 10;

export function QuizScreen({ questions, answers, onChange, estimate, prefilledFrom, onSubmit, onSkip, onBack }: Props) {
  const reduce = useReducedMotion();
  return (
    <div className="mx-auto max-w-[720px] px-4 pt-8 pb-10 sm:px-6 sm:pt-14">
      <button
        type="button"
        onClick={onBack}
        className="press -ml-2 inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-muted hover:bg-ink/[0.05] hover:text-ink"
      >
        <ArrowLeft size={14} /> Statement
      </button>
      <header className="mt-4">
        <h1 className="heading text-[32px] sm:text-[44px]">
          {questions.length === 1 ? 'One question' : `${questions.length} quick questions`}
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
          Your statement can't show these. Answering sharpens the numbers; skipping makes them estimates.
          {prefilledFrom && <> Prefilled from {prefilledFrom}'s sample — change anything.</>}
        </p>
      </header>

      <ol className="mt-10 space-y-4">
        {questions.map((q, i) => (
          <motion.li
            key={q.id}
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.enter, delay: 0.05 + i * STAGGER * 1.5 }}
            className="rounded-[22px] bg-card p-5 shadow-card sm:p-6"
          >
            <fieldset>
              <legend className="w-full">
                <span className="text-[12px] font-medium tabular-nums text-faint">
                  {i + 1} of {questions.length}
                </span>
                <span className="heading mt-1 block text-[19px] text-ink">{q.prompt}</span>
                <span className="mt-1 block text-[14px] text-muted">{q.reason}</span>
              </legend>
              <div className="mt-5">
                {q.kind === 'number' ? (
                  <LinesStepper
                    value={answers.phoneLines}
                    onChange={(phoneLines) => onChange({ ...answers, phoneLines })}
                  />
                ) : (
                  <MultiChoice
                    options={q.options ?? []}
                    selected={answers.perkProviders ?? []}
                    onChange={(perkProviders) => onChange({ ...answers, perkProviders })}
                  />
                )}
              </div>
            </fieldset>
          </motion.li>
        ))}
      </ol>

      <div className="sticky bottom-[max(12px,env(safe-area-inset-bottom))] z-10 mt-8">
        <div className="flex flex-col gap-3 rounded-[22px] bg-card/90 p-3 shadow-lift backdrop-blur-xl sm:flex-row sm:items-center">
          <div className="flex-1 px-2" aria-live="polite">
            <div className="text-[12px] text-muted">With these answers</div>
            <div className="heading text-[20px] text-accent">
              <AnimatedRange low={estimate.low} high={estimate.high} />
              <span className="ml-1 text-[13px] font-medium text-muted">/yr</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onSkip} className="flex-1 sm:flex-none">
              Skip
            </Button>
            <Button variant="primary" onClick={onSubmit} className="flex-[2] sm:flex-none">
              See results
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinesStepper({ value, onChange }: { value: number | undefined; onChange: (v: number | undefined) => void }) {
  const set = (v: number) => onChange(Math.min(MAX_LINES, Math.max(MIN_LINES, v)));
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center rounded-full bg-paper p-1 ring-1 ring-line">
        <button
          type="button"
          aria-label="Fewer lines"
          disabled={value !== undefined && value <= MIN_LINES}
          onClick={() => set((value ?? 2) - 1)}
          className="press press-sm flex size-10 items-center justify-center rounded-full text-ink hover:bg-card hover:shadow-card"
        >
          <Minus />
        </button>
        <output
          aria-live="polite"
          className="w-16 text-center text-[22px] font-semibold tracking-[-0.02em] tabular-nums text-ink"
        >
          {value ?? '–'}
        </output>
        <button
          type="button"
          aria-label="More lines"
          disabled={value !== undefined && value >= MAX_LINES}
          onClick={() => set((value ?? 0) + 1)}
          className="press press-sm flex size-10 items-center justify-center rounded-full text-ink hover:bg-card hover:shadow-card"
        >
          <Plus />
        </button>
      </div>
      <span className="text-[14px] text-muted">{value === 1 ? 'line' : 'lines'}</span>
      <button
        type="button"
        aria-pressed={value === undefined}
        onClick={() => onChange(undefined)}
        className={`press ml-auto h-9 rounded-full px-3.5 text-[13px] font-medium ${
          value === undefined ? 'bg-ink text-white' : 'text-muted ring-1 ring-line hover:text-ink'
        }`}
      >
        Not sure — estimate it
      </button>
    </div>
  );
}

function MultiChoice({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <label
            key={o.value}
            className={`press flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-[14px] select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
              on ? 'bg-accent-tint text-ink ring-[1.5px] ring-accent' : 'bg-paper text-ink-2 ring-1 ring-line hover:ring-line-2'
            }`}
          >
            <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(o.value)} />
            <span
              aria-hidden="true"
              className={`flex size-5 shrink-0 items-center justify-center rounded-md transition-colors duration-150 ${
                on ? 'bg-accent text-white' : 'bg-card ring-1 ring-line-2'
              }`}
            >
              {on && <Check size={12} strokeWidth={2.4} />}
            </span>
            <span className="font-medium">{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}
