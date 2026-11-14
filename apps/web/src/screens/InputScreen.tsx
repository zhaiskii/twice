/**
 * Screen 2 — Input. Pick a sample household or drop your own CSV(s). Parsing
 * happens on selection; the floating bar reports what the parser saw.
 */
import type { Persona } from '@twice/engine';
import { AnimatePresence } from 'motion/react';
import { useEffect, useRef } from 'react';
import { Dropzone } from '../components/Dropzone';
import { ParseBar, ParseError } from '../components/ParseBanner';
import { PersonaCard } from '../components/PersonaCard';
import { hasSample, type Loaded } from '../lib/samples';

interface Props {
  personas: Persona[];
  loaded: Loaded | null;
  recurringCount: number;
  errors: string[];
  busy: boolean;
  onPickPersona: (persona: Persona) => void;
  onFiles: (files: FileList) => void;
  onContinue: () => void;
}

export function InputScreen({ personas, loaded, recurringCount, errors, busy, onPickPersona, onFiles, onContinue }: Props) {
  const samplesRef = useRef<HTMLElement>(null);
  const selectedId = loaded?.source.kind === 'persona' ? loaded.source.persona.id : null;

  // A file dropped outside the dropzone must not make the browser navigate to it.
  useEffect(() => {
    const block = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', block);
    window.addEventListener('drop', block);
    return () => {
      window.removeEventListener('dragover', block);
      window.removeEventListener('drop', block);
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1080px] px-4 pt-8 pb-40 sm:px-6 sm:pt-14">
      <header className="max-w-2xl">
        <h1 className="heading text-[32px] sm:text-[44px]">Choose a statement</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
          Start with a sample household, or drop your own CSV export. Either way, it's read in this browser and never
          uploaded.
        </p>
      </header>

      <section ref={samplesRef} aria-labelledby="samples-title" className="mt-10 scroll-mt-24">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="samples-title" className="eyebrow">
            Sample statements
          </h2>
          <span className="text-[12.5px] whitespace-nowrap text-faint">Made-up people<span className="hidden sm:inline"> · 12 months each</span></span>
        </div>
        {personas.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {personas.map((p) => (
              <PersonaCard
                key={p.id}
                persona={p}
                available={hasSample(p)}
                selected={selectedId === p.id}
                onSelect={() => onPickPersona(p)}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-[18px] bg-card p-5 text-[14px] text-muted shadow-card">
            No sample statements are bundled in this build. Drop a CSV below.
          </p>
        )}
      </section>

      <div className="my-8 flex items-center gap-4 text-[12px] font-medium text-faint" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        or use your own
        <span className="h-px flex-1 bg-line" />
      </div>

      <section aria-label="Upload your own statement">
        <Dropzone onFiles={onFiles} busy={busy} />
        <AnimatePresence>
          {errors.length > 0 && (
            <ParseError
              key={errors.join('|')}
              messages={errors}
              onTrySample={
                personas.length > 0
                  ? () => samplesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  : undefined
              }
            />
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {loaded && loaded.transactions.length > 0 && (
          <ParseBar key="bar" loaded={loaded} recurring={recurringCount} onContinue={onContinue} />
        )}
      </AnimatePresence>
    </div>
  );
}
