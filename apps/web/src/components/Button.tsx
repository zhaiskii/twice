/**
 * The one button. Variants map to intent, not color:
 *   primary   — the next step on a screen (ink, one per view)
 *   secondary — a real alternative (white card)
 *   ghost     — low-stakes actions (back, skip, edit)
 *   accent    — reserved for money actions (unlock, open kit)
 * Renders an <a> when `href` is given so links keep native semantics.
 */
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent';
type Size = 'sm' | 'md' | 'lg';

const base =
  'press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium select-none disabled:opacity-45 [&_svg]:shrink-0';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white shadow-button hover:bg-[#2a2d28]',
  secondary: 'bg-card text-ink shadow-card hover:bg-[#fbfaf7] hover:shadow-lift',
  ghost: 'text-ink-2 hover:bg-ink/[0.05] hover:text-ink',
  accent:
    'bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_2px_rgb(7_95_58/0.35),0_0_0_1px_var(--color-accent-strong)] hover:bg-accent-strong',
};

// DECISION(sizes): 44px min height for lg/md on touch (Apple HIG target), 36px for sm
// which only appears inside dense cards and toolbars.
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-[14px]',
  lg: 'h-12 px-6 text-[15px]',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function Button(props: ButtonProps | LinkProps) {
  const { variant = 'secondary', size = 'md', className = '', children, ...rest } = props;
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (rest.href !== undefined) {
    const anchor = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a className={cls} {...anchor}>
        {children}
      </a>
    );
  }
  const button = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={cls} {...button}>
      {children}
    </button>
  );
}

/** Square icon-only button. Always pass an aria-label. */
export function IconButton({
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { 'aria-label': string }) {
  return (
    <button
      type="button"
      className={`press press-sm inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-ink/[0.06] hover:text-ink ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
