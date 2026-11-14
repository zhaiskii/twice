/**
 * Sticky translucent header: logo (home), step wayfinding inside the app, privacy.
 *
 * DECISION(scroll-edge): no permanent divider. A hairline + blur fade in only once
 * content scrolls under the header — chrome appears where it overlaps content.
 */
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Github, Shield } from './Icons';
import { Logo } from './Logo';
import { REPO_URL } from './Footer';

export type Step = 'landing' | 'input' | 'quiz' | 'results';

const STEPS: { id: Exclude<Step, 'landing'>; label: string }[] = [
  { id: 'input', label: 'Statement' },
  { id: 'quiz', label: 'Questions' },
  { id: 'results', label: 'Results' },
];

interface Props {
  step: Step;
  /** Steps the user may jump back to (have data for). */
  reachable: (step: Step) => boolean;
  onNavigate: (step: Step) => void;
  onPrivacy: () => void;
}

function useScrolled(threshold = 4) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

export function Header({ step, reachable, onNavigate, onPrivacy }: Props) {
  const scrolled = useScrolled();
  const current = STEPS.findIndex((s) => s.id === step);

  return (
    <header
      className={`sticky top-0 z-30 transition-[background-color,box-shadow,backdrop-filter] duration-200 ${
        scrolled
          ? 'bg-paper/80 shadow-[0_1px_0_rgb(20_22_19/0.07)] backdrop-blur-xl backdrop-saturate-150'
          : 'bg-paper/0'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="press -ml-2 rounded-full px-2 py-1.5"
          aria-label="Twice — home"
        >
          <Logo />
        </button>

        {step !== 'landing' && (
          <nav aria-label="Progress" className="ml-1 min-w-0 flex-1 sm:ml-4">
            <ol className="flex items-center gap-1">
              {STEPS.map((s, i) => {
                const active = s.id === step;
                const enabled = !active && reachable(s.id);
                return (
                  <li key={s.id} className={`${active ? 'flex' : 'hidden sm:flex'} items-center`}>
                    {i > 0 && <span className="mx-1 hidden h-px w-4 bg-line-2 sm:block" aria-hidden="true" />}
                    <button
                      type="button"
                      disabled={!enabled}
                      aria-current={active ? 'step' : undefined}
                      onClick={() => onNavigate(s.id)}
                      className={`press relative rounded-full px-3 py-1.5 text-[13px] font-medium disabled:cursor-default disabled:opacity-100 ${
                        active ? 'text-ink' : enabled ? 'text-muted hover:text-ink' : 'text-faint'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="step-pill"
                          className="absolute inset-0 rounded-full bg-card shadow-card"
                          transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
                        />
                      )}
                      <span className="relative">
                        <span className="mr-1.5 text-faint tabular-nums sm:hidden">
                          {i + 1}/{STEPS.length}
                        </span>
                        {s.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <span className="sr-only">
              Step {current + 1} of {STEPS.length}
            </span>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onPrivacy}
            className="press inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink-2 hover:bg-ink/[0.05] hover:text-ink"
          >
            <Shield className="text-accent" />
            <span className="hidden sm:inline">Privacy</span>
            <span className="sr-only sm:hidden">Privacy</span>
          </button>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="press press-sm inline-flex size-9 items-center justify-center rounded-full text-ink-2 hover:bg-ink/[0.05] hover:text-ink"
            aria-label="Source code on GitHub"
          >
            <Github />
          </a>
        </div>
      </div>
    </header>
  );
}
