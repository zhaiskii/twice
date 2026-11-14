/**
 * Inline icon set. 16px grid, 1.6 stroke, currentColor.
 * DECISION(no-icon-lib): ~15 glyphs don't justify a dependency; inline SVG also
 * inherits color and press-scale with its button for free.
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </Svg>
);
export const ArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 8H3M7 4L3 8l4 4" />
  </Svg>
);
export const ArrowUpRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 11l6-6M6 5h5v5" />
  </Svg>
);
export const Check = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 8.5l3 3 6-7" />
  </Svg>
);
export const Close = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Svg>
);
export const Plus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 3v10M3 8h10" />
  </Svg>
);
export const Minus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8h10" />
  </Svg>
);
export const Trash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" />
  </Svg>
);
export const Upload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 10.5V3M5 6l3-3 3 3M3 10.5V13h10v-2.5" />
  </Svg>
);
export const FileText = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 2H4.5v12h7V4.5L9.5 2zM9.5 2v2.5H12M6 8h4M6 10.5h4" />
  </Svg>
);
export const Table = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="3" width="11" height="10" rx="1.5" />
    <path d="M2.5 6.5h11M2.5 9.8h11M6.5 6.5V13" />
  </Svg>
);
export const Lock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
  </Svg>
);
export const Shield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 2l5 2v4c0 3-2.2 5.2-5 6-2.8-.8-5-3-5-6V4l5-2z" />
    <path d="M5.8 8.2l1.6 1.6 2.9-3.3" />
  </Svg>
);
export const Link = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 9a2.5 2.5 0 003.5 0l2-2A2.5 2.5 0 009 3.5l-.7.7M9 7a2.5 2.5 0 00-3.5 0l-2 2A2.5 2.5 0 007 12.5l.7-.7" />
  </Svg>
);
export const Search = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7" cy="7" r="4.25" />
    <path d="M10.2 10.2L13.5 13.5" />
  </Svg>
);
export const Alert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 2.5l6 10.5H2L8 2.5z" />
    <path d="M8 6.5v3M8 11.3v.2" />
  </Svg>
);
export const Refresh = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 5.5A5.5 5.5 0 003.2 6M3 10.5A5.5 5.5 0 0012.8 10M13 2.5v3h-3M3 13.5v-3h3" />
  </Svg>
);
export const TrendUp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 11.5l4-4 2.5 2.5 4.5-5M10 5h3.5v3.5" />
  </Svg>
);
export const Github = ({ size = 16, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false" {...rest}>
    <path d="M8 .2a8 8 0 00-2.53 15.6c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.22 1.88.87 2.33.66.07-.52.28-.87.5-1.07-1.77-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82a7.6 7.6 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.14.46.55.38A8 8 0 008 .2z" />
  </svg>
);
