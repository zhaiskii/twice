/**
 * Multi-file CSV drop target. A <label> wraps a visually hidden file input, so it is
 * keyboard- and screen-reader-operable with no JS click forwarding.
 */
import { useRef, useState, type DragEvent } from 'react';
import { ACCEPT } from '../lib/upload';
import { FileText, Upload } from './Icons';

interface Props {
  onFiles: (files: FileList) => void;
  busy: boolean;
}

export function Dropzone({ onFiles, busy }: Props) {
  const [over, setOver] = useState(false);
  // dragenter/leave fire for every child; count depth so hovering the icon doesn't flicker.
  const depth = useRef(0);

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    depth.current += 1;
    setOver(true);
  };
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setOver(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    depth.current = 0;
    setOver(false);
    if (e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files);
  };

  return (
    <label
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-[22px] border-[1.5px] border-dashed px-6 py-10 text-center transition-[background-color,border-color,transform] duration-200 ease-out has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent sm:py-14 ${
        over ? 'scale-[1.01] border-accent bg-accent-tint' : 'border-line-2 bg-card/50 hover:border-faint hover:bg-card'
      }`}
    >
      <input
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) onFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <span
        className={`flex size-12 items-center justify-center rounded-2xl shadow-card transition-colors duration-200 ${
          over ? 'bg-accent text-white' : 'bg-card text-ink'
        }`}
      >
        {busy ? <Spinner /> : over ? <FileText size={20} /> : <Upload size={20} />}
      </span>
      <span className="mt-4 text-[16px] font-semibold tracking-[-0.015em] text-ink">
        {busy ? 'Reading your files…' : over ? 'Drop to read in this browser' : 'Drop CSV files here'}
      </span>
      <span className="mt-1 text-[14px] text-muted">
        or <span className="font-medium text-ink underline decoration-line-2 underline-offset-4 group-hover:decoration-ink">choose files</span>{' '}
        — add several to merge cards and accounts
      </span>
      <span className="mt-5 max-w-md text-[12.5px] leading-relaxed text-faint">
        Chase, American Express, Bank of America, Capital One and Discover exports, or any CSV with a date, a
        description and an amount.
      </span>
    </label>
  );
}

function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="animate-spin" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <path d="M17.5 10A7.5 7.5 0 0010 2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
