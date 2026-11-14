/**
 * Motion vocabulary. Every animated thing in the app picks from these presets so
 * the whole UI moves with one personality: calm, quick, no wobble.
 *
 * DECISION(springs): critically damped (bounce 0) by default — Apple's default for
 * UI that wasn't thrown. Only sheets get a hint of bounce (0.12), because the user
 * pulled them up or flicked them down; overshoot on a card that merely appeared
 * reads as sloppy. Revisit values by playing them at 3× slow-mo, not by feel at 1×.
 */
import type { Transition } from 'motion/react';

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

export const spring = {
  /** Layout reflow: cards sliding up when one disappears, rows collapsing. */
  layout: { type: 'spring', duration: 0.42, bounce: 0 },
  /** Sheets and drawers (Apple drawer: damping ≈ 0.8, response ≈ 0.3–0.45). */
  sheet: { type: 'spring', duration: 0.48, bounce: 0.12 },
  /** Things that appear in place: cards, banners, chips. */
  enter: { type: 'spring', duration: 0.5, bounce: 0 },
} satisfies Record<string, Transition>;

/** Exits are faster than entrances: the system is responding, the user isn't deciding. */
export const exitFast: Transition = { duration: 0.18, ease: EASE_OUT };

// DECISION(stagger): 50ms between cards — long enough to read as a cascade, short
// enough that the last of ~8 cards lands in under half a second. Stagger never
// blocks input.
export const STAGGER = 0.05;
