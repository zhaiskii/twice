/**
 * Site footer: repo link (judges read the code), privacy, and the honesty line.
 */
import { Github } from './Icons';
import { LogoMark } from './Logo';

export const REPO_URL = 'https://github.com/zhaiskii/twice';

export function Footer({ onPrivacy }: { onPrivacy: () => void }) {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 text-ink">
            <LogoMark size={18} />
            <span className="text-[14px] font-semibold tracking-[-0.02em]">Twice</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Finds what you pay for twice. We don't cancel or haggle for you. Every price links to the page it came
            from, with the date we checked it.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-1 gap-y-2 text-[13px]">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="press inline-flex h-9 items-center gap-2 rounded-full px-3 font-medium text-ink-2 hover:bg-ink/[0.05] hover:text-ink"
          >
            <Github />
            Source on GitHub
          </a>
          <button
            type="button"
            onClick={onPrivacy}
            className="press inline-flex h-9 items-center rounded-full px-3 font-medium text-ink-2 hover:bg-ink/[0.05] hover:text-ink"
          >
            What leaves your browser
          </button>
        </nav>
      </div>
    </footer>
  );
}
