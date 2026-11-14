/**
 * Privacy panel: "What leaves your browser: nothing." — literally true in v0 (static
 * site, no backend, no analytics). AGENT: if you ever add a network call that carries
 * user data, this copy becomes false — change it in the same commit.
 */
import { useState } from 'react';
import { Dialog, DialogHeader } from './Dialog';
import { Check, Github } from './Icons';
import { REPO_URL } from './Footer';

const FACTS = [
  {
    title: 'No upload',
    body: 'Your CSV is read by this page with the browser’s File API. Twice has no server to send it to.',
  },
  {
    title: 'Computed in this tab',
    body: 'Parsing and every calculation run here, in the open-source engine you can read on GitHub.',
  },
  {
    title: 'No account, no tracking',
    body: 'No sign-up, no bank login, no cookies, no analytics.',
  },
  {
    title: 'Stored on this device only',
    body: 'Your switch-kit checkmarks and the Plus demo flag, in localStorage. Never your transactions.',
  },
];

export function PrivacyPanel({ onClear, onClose }: { onClear: () => void; onClose: () => void }) {
  const [cleared, setCleared] = useState(false);
  return (
    <Dialog variant="sheet" onClose={onClose} labelledBy="privacy-title">
      <DialogHeader id="privacy-title" eyebrow="Privacy" title="What leaves your browser: nothing." onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 sm:px-6">
        <ul className="divide-y divide-line">
          {FACTS.map((f) => (
            <li key={f.title} className="flex gap-3.5 py-3.5">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent">
                <Check size={12} strokeWidth={2.4} />
              </span>
              <span>
                <span className="block text-[15px] font-medium tracking-[-0.01em] text-ink">{f.title}</span>
                <span className="mt-0.5 block text-[14px] leading-relaxed text-muted">{f.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3.5 sm:px-6">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="press inline-flex h-9 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-ink-2 hover:bg-ink/[0.05] hover:text-ink"
        >
          <Github />
          Read the code
        </a>
        <button
          type="button"
          onClick={() => {
            onClear();
            setCleared(true);
          }}
          disabled={cleared}
          className="press inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3.5 text-[13px] font-medium text-ink shadow-card hover:shadow-lift disabled:opacity-100"
        >
          {cleared ? (
            <>
              <Check size={13} className="text-accent" /> Cleared
            </>
          ) : (
            'Clear saved progress'
          )}
        </button>
      </div>
    </Dialog>
  );
}
