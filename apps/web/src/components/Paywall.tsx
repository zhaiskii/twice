/**
 * Paywall — shown when opening a second switch kit on the free tier.
 *
 * DECISION(honest-paywall): renewal price and one-click cancel are stated before the
 * button, no countdown, no pre-checked upsell (FTC dark-pattern cases target exactly
 * those). There is no Stripe account yet, so the button says what it does:
 * "Unlock demo — no charge". AGENT: when real checkout lands, keep the terms copy
 * above the button and change only the button label + handler.
 */
import { useId, useState } from 'react';
import { Button } from './Button';
import { Dialog, DialogHeader } from './Dialog';
import { Check } from './Icons';

// DECISION(pricing): numbers from docs/SPEC.md §7 (Twice Plus). Derived figures below
// are computed, not typed, so changing a price can't leave a stale "save %" behind.
const MONTHLY_FIRST = 7.49;
const MONTHLY = 14.99;
const YEARLY = 79;
const yearlySavePct = Math.round((1 - YEARLY / (MONTHLY * 12)) * 100);
const yearlyPerMonth = YEARLY / 12;

type Plan = 'monthly' | 'yearly';

const fmt = (n: number) => `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;

const INCLUDES = [
  'Every switch kit, step by step',
  'Bill Detox progress across all your switches',
  'Re-scan any statement — still never uploaded',
];

export function Paywall({ onUnlock, onClose }: { onUnlock: () => void; onClose: () => void }) {
  const [plan, setPlan] = useState<Plan>('yearly');
  const name = useId();

  return (
    <Dialog variant="modal" onClose={onClose} labelledBy="paywall-title">
      <DialogHeader id="paywall-title" eyebrow="Twice Plus" title="Unlock every switch kit" onClose={onClose}>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
          Your first kit is free, and every finding stays free. Plus opens the rest of the kits.
        </p>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
        <fieldset>
          <legend className="sr-only">Choose a plan</legend>
          <div className="grid grid-cols-2 gap-2.5">
            <PlanOption
              name={name}
              checked={plan === 'monthly'}
              onSelect={() => setPlan('monthly')}
              title="Monthly"
              price={fmt(MONTHLY_FIRST)}
              unit="first month"
              note={`then ${fmt(MONTHLY)}/mo`}
            />
            <PlanOption
              name={name}
              checked={plan === 'yearly'}
              onSelect={() => setPlan('yearly')}
              title="Yearly"
              price={fmt(YEARLY)}
              unit="/yr"
              note={`≈ ${fmt(Math.round(yearlyPerMonth * 100) / 100)}/mo`}
              badge={`Save ${yearlySavePct}%`}
            />
          </div>
        </fieldset>

        <ul className="mt-5 space-y-2">
          {INCLUDES.map((t) => (
            <li key={t} className="flex items-center gap-2.5 text-[14px] text-ink-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent">
                <Check size={11} strokeWidth={2.4} />
              </span>
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-2xl bg-paper px-4 py-3.5 text-[13px] leading-relaxed text-ink-2 ring-1 ring-line">
          {plan === 'monthly' ? (
            <p>
              {fmt(MONTHLY_FIRST)} today, then <strong className="font-semibold text-ink">{fmt(MONTHLY)} every month</strong>{' '}
              until you cancel.
            </p>
          ) : (
            <p>
              {fmt(YEARLY)} today, then <strong className="font-semibold text-ink">{fmt(YEARLY)} every year</strong> until
              you cancel.
            </p>
          )}
          <p className="mt-1">Cancel in one click, any time. No calls, no chat, no countdown.</p>
        </div>

        <Button variant="accent" size="lg" className="mt-5 w-full" onClick={onUnlock}>
          Unlock demo — no charge
        </Button>
        <p className="mt-2.5 text-center text-[12px] leading-relaxed text-muted">
          This is a demo: checkout isn't connected yet, so no card is asked for and nothing is charged.
        </p>
        <div className="mt-2 flex justify-center">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Not now
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function PlanOption(p: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  price: string;
  unit: string;
  note: string;
  badge?: string;
}) {
  return (
    <label
      className={`press relative flex cursor-pointer flex-col rounded-2xl p-4 select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
        p.checked ? 'bg-accent-tint shadow-[0_0_0_2px_var(--color-accent)]' : 'bg-card shadow-card hover:shadow-lift'
      }`}
    >
      <input type="radio" name={p.name} className="sr-only" checked={p.checked} onChange={p.onSelect} />
      <span className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-ink-2">{p.title}</span>
        {p.badge && (
          <span className="rounded-full bg-accent px-2 py-px text-[11px] font-semibold text-white">{p.badge}</span>
        )}
      </span>
      <span className="mt-3 flex items-baseline gap-1">
        <span className="text-[26px] font-semibold tracking-[-0.03em] tabular-nums text-ink">{p.price}</span>
        <span className="text-[13px] text-muted">{p.unit}</span>
      </span>
      <span className="mt-0.5 text-[12.5px] tabular-nums text-muted">{p.note}</span>
    </label>
  );
}
