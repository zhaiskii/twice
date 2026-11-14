/**
 * Small React hooks with no app knowledge: media queries and a "latest value" ref.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';

/** Subscribes to a CSS media query. Capability queries only — never sniff user agents. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** A ref that always holds the latest value — for event listeners registered once. */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
