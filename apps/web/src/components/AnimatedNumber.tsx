/**
 * A number that rolls to its new value. Used for every total that the engine
 * recomputes, so an edit in the statement table visibly moves the result.
 *
 * DECISION(roll-from-presentation): on interruption the roll restarts from the
 * value currently on screen, not the old target — a fast second edit never jumps.
 * Text is written straight to the DOM in onUpdate so a roll costs zero React
 * renders. Screen readers get the final value via a visually hidden twin.
 */
import { animate, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';
import { EASE_OUT } from '../lib/motion';
import { money } from '../lib/format';

interface Props {
  value: number;
  format?: (n: number) => string;
  /** First mount rolls up from this value (e.g. 0 on the results reveal). */
  from?: number;
  /** Seconds. Results reveal ≈ 1.1s (rare, explanatory); edits ≈ 0.6s. */
  duration?: number;
  delay?: number;
  className?: string;
}

export function AnimatedNumber({ value, format = money, from, duration = 0.6, delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = shown.current ?? from ?? value;
    if (reduce || start === value) {
      shown.current = value;
      el.textContent = format(value);
      return;
    }
    el.textContent = format(start);
    const controls = animate(start, value, {
      duration,
      delay: shown.current === null ? delay : 0,
      ease: EASE_OUT,
      onUpdate: (v) => {
        shown.current = v;
        el.textContent = format(v);
      },
    });
    return () => controls.stop();
    // format is a stable module function in every call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return (
    <span className={`tabular-nums ${className}`}>
      <span ref={ref} aria-hidden="true" />
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

/** "$480–$1,320" with both ends rolling; collapses to one number when low = high. */
export function AnimatedRange({
  low,
  high,
  from,
  duration,
  delay,
  className = '',
}: {
  low: number;
  high: number;
  from?: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const equal = Math.round(low) === Math.round(high);
  return (
    <span className={`tabular-nums ${className}`}>
      {!equal && (
        <>
          <AnimatedNumber value={low} from={from} duration={duration} delay={delay} />
          <span aria-hidden="true">–</span>
          <span className="sr-only"> to </span>
        </>
      )}
      <AnimatedNumber value={high} from={from} duration={duration} delay={delay} />
    </span>
  );
}
