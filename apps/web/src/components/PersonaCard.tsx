/**
 * A sample household. Selecting it parses its CSV immediately — the banner that
 * follows is real parser output, which is the first "nothing is canned" proof.
 */
import type { Persona } from '@twice/engine';
import { AnimatePresence, motion } from 'motion/react';
import { FORMAT_LABEL } from '../lib/format';
import { Check } from './Icons';

interface Props {
  persona: Persona;
  selected: boolean;
  available: boolean;
  onSelect: () => void;
}

function initials(name: string): string {
  // "Maya, Austin renter" → "M"; "Jordan & Sam, couple" → "JS". Only the part before the comma is a name.
  const words = (name.split(',')[0] ?? name).split(/[\s&]+/).filter((w) => /^[A-Z]/.test(w));
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

export function PersonaCard({ persona, selected, available, onSelect }: Props) {
  const [title, ...rest] = persona.name.split(',');
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!available}
      aria-pressed={selected}
      className={`press group relative flex h-full flex-col rounded-[20px] bg-card p-5 text-left ${
        selected ? 'shadow-[0_0_0_2px_var(--color-accent),0_8px_24px_-8px_rgb(11_122_75/0.35)]' : 'shadow-card hover:shadow-lift'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={`flex size-10 items-center justify-center rounded-full text-[13px] font-semibold tracking-[-0.01em] transition-colors duration-200 ${
            selected ? 'bg-accent text-white' : 'bg-sunk text-ink-2'
          }`}
        >
          {initials(persona.name) || '•'}
        </span>
        <AnimatePresence>
          {selected && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
              className="flex size-6 items-center justify-center rounded-full bg-accent text-white"
            >
              <Check size={13} strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-4">
        <div className="text-[16px] font-semibold tracking-[-0.015em] text-ink">{title}</div>
        {rest.length > 0 && <div className="text-[13px] text-muted">{rest.join(',').trim()}</div>}
      </div>
      <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-ink-2">{persona.blurb}</p>
      <div className="mt-4 flex min-w-0 items-center gap-2 border-t border-line pt-3 text-[12px] whitespace-nowrap text-muted">
        <span className="truncate font-mono text-[11.5px]">{persona.file}</span>
        <span aria-hidden="true">·</span>
        <span className="truncate">{available ? FORMAT_LABEL[persona.format] : 'File missing'}</span>
      </div>
    </button>
  );
}
