/**
 * The only persistence in Twice: a few flags in this browser's localStorage.
 * Nothing about the statement itself is ever stored — only kit checkboxes,
 * which kit was the free one, and the demo "Plus unlocked" flag.
 *
 * DECISION(storage-safety): every read/write is wrapped in try/catch. Safari
 * private mode, blocked site data and embedded previews throw on access; the
 * app must keep working with in-memory state when that happens.
 */
import { useCallback, useState } from 'react';

// AGENT: if you add a key, add it here so "Clear saved progress" (PrivacyPanel) wipes it.
export const STORAGE_KEYS = {
  kits: 'twice.v1.kits',
  freeKit: 'twice.v1.freeKit',
  plus: 'twice.v1.plus',
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    if (value === undefined || value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — state stays in memory for this session */
  }
}

export function clearSaved(): void {
  for (const key of Object.values(STORAGE_KEYS)) writeJSON(key, null);
}

/** useState that mirrors to localStorage. Reads once on mount; writes on every set. */
export function usePersistentState<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readJSON(key, initial));
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        writeJSON(key, resolved);
        return resolved;
      });
    },
    [key],
  );
  return [value, set];
}
