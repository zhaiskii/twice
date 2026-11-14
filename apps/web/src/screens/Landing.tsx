/**
 * Screen 1 — Landing. One idea above the fold: "You're paying twice." plus a live
 * finding computed from a sample, two ways in, and three trust facts.
 */
import { motion, useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { Button } from '../components/Button';
import { HeroPreview } from '../components/HeroPreview';
import { ArrowRight, Link, Lock, Shield, Upload } from '../components/Icons';
import { KIND_META, KIND_ORDER } from '../lib/findings';
import { spring } from '../lib/motion';
import type { HeroSample } from '../lib/samples';
import { ACCEPT } from '../lib/upload';

interface Props {
  hero: HeroSample | null;
  onTrySample: () => void;
  onFiles: (files: FileList) => void;
  onOpenHero: () => void;
}

const TRUST = [
  { icon: Lock, text: 'No bank login' },
  { icon: Shield, text: 'Your file never leaves this browser' },
  { icon: Link, text: 'Every number links to its source' },
];

const KIND_COPY: Record<(typeof KIND_ORDER)[number], string> = {
  paying_twice: 'Netflix you pay for while your phone plan already includes it.',
  phone_switch: 'A Verizon, AT&T or T-Mobile bill next to plans on the same towers.',
  overlap: 'Two music apps. Two cloud drives. Two delivery passes.',
  price_step: 'The exact charge where a price quietly went up.',
};

export function Landing({ hero, onTrySample, onFiles, onOpenHero }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { ...spring.enter, delay },
  });

  return (
    <div>
      <section className="relative">
        <div className="ledger-grid pointer-events-none absolute inset-x-0 -top-16 h-[680px]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-4 pt-10 pb-16 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10 lg:pt-24 lg:pb-24">
          <div>
            <motion.p {...rise(0)} className="eyebrow mb-5 text-accent-strong">
              For US bank &amp; card statements
            </motion.p>
            <motion.h1 {...rise(0.04)} className="display text-[clamp(3rem,10.5vw,6rem)] text-ink">
              You're paying <Twice />
            </motion.h1>
            <motion.p {...rise(0.1)} className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-ink-2 sm:text-[18px]">
              Drop in a bank or card CSV. Twice finds the services your phone plan or card already includes, apps
              doing the same job, and your phone network for less.
            </motion.p>
            <motion.div {...rise(0.16)} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button variant="primary" size="lg" onClick={onTrySample}>
                Try a sample
                <ArrowRight />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => fileInput.current?.click()}>
                <Upload />
                Upload CSV
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                aria-label="Upload CSV statement"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) onFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </motion.div>
            <motion.ul {...rise(0.22)} className="mt-9 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {TRUST.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-[13.5px] text-ink-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-accent-tint text-accent">
                    <Icon size={13} />
                  </span>
                  {text}
                </li>
              ))}
            </motion.ul>
          </div>

          <HeroPreview sample={hero} onOpen={onOpenHero} />
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 sm:px-6" aria-labelledby="finds-title">
        <div className="border-t border-line pt-14 sm:pt-20">
          <div className="max-w-xl">
            <p className="eyebrow mb-3">What Twice looks for</p>
            <h2 id="finds-title" className="heading text-[28px] sm:text-[34px]">
              Four ways the same dollar leaves twice.
            </h2>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {KIND_ORDER.map((kind, i) => (
              <li key={kind} className="rounded-[18px] bg-card p-5 shadow-card">
                <span className="text-[12px] font-medium tabular-nums text-faint">0{i + 1}</span>
                <h3 className="heading mt-6 text-[17px]">{KIND_META[kind].group}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{KIND_COPY[kind]}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pt-20 sm:px-6 sm:pt-28" aria-labelledby="stance-title">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
          <h2 id="stance-title" className="heading max-w-2xl text-[28px] leading-[1.12] sm:text-[40px]">
            We don't cancel or haggle.{' '}
            <span className="text-muted">
              We find the cheaper twin of what you keep — and what you already get free.
            </span>
          </h2>
          <dl className="grid grid-cols-1 gap-6 self-end sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <dt className="text-[15px] font-semibold">Rules you can read</dt>
              <dd className="mt-1 text-[14px] leading-relaxed text-muted">
                No AI guessing at your money. Plain rules run on your rows, and every card shows the rule that fired.
              </dd>
            </div>
            <div>
              <dt className="text-[15px] font-semibold">Prices with receipts</dt>
              <dd className="mt-1 text-[14px] leading-relaxed text-muted">
                Every plan, perk and price links to the official page, with the date we checked it.
              </dd>
            </div>
            <div>
              <dt className="text-[15px] font-semibold">Edit anything</dt>
              <dd className="mt-1 text-[14px] leading-relaxed text-muted">
                Change or delete a row in your statement and watch the result recompute. Nothing is canned.
              </dd>
            </div>
          </dl>
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-[24px] bg-ink px-6 py-8 text-white sm:flex-row sm:items-center sm:px-10 sm:py-10">
          <div>
            <p className="heading text-[22px] sm:text-[26px]">See it on a sample in 60 seconds.</p>
            <p className="mt-1 text-[14px] text-white/60">Three made-up households, real bank formats. No sign-up.</p>
          </div>
          <button
            type="button"
            onClick={onTrySample}
            className="press inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-medium text-ink hover:bg-white/90"
          >
            Try a sample
            <ArrowRight />
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * "twice." with a misregistered ghost copy in the accent — the word literally appears
 * twice. The ghost slides out from behind once on load (explanation, not decoration:
 * it is the product's one-line pitch made visible).
 */
function Twice() {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-block whitespace-nowrap">
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 text-accent-bright/70 select-none"
        initial={{ x: 0, y: 0, opacity: 0 }}
        animate={{ x: '0.055em', y: '0.045em', opacity: 1 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', duration: 0.9, bounce: 0, delay: 0.55 }}
      >
        twice.
      </motion.span>
      <span className="relative">twice.</span>
    </span>
  );
}
