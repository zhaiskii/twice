/**
 * Twice mark: two overlapping rings — the second one in the accent. The overlap is
 * the product: the part you pay for twice. Wordmark is set in the UI face.
 */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="9" cy="12" r="6.25" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="15" cy="12" r="6.25" fill="none" stroke="var(--color-accent)" strokeWidth="2" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-ink">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-[-0.03em]">Twice</span>
    </span>
  );
}
