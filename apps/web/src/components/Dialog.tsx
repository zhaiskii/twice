/**
 * Modal surface used by every overlay: statement drawer, switch kit, paywall, privacy.
 *
 * DECISION(native-dialog): built on <dialog>.showModal(). The browser gives us the
 * top layer, `inert` on the page behind (a real focus trap — Tab can't reach the
 * page), Esc via the `cancel` event, and correct dialog semantics, with no library.
 * We intercept `cancel` so Esc runs the same exit animation as the close button.
 * Mount it inside <AnimatePresence>; unmount = close.
 *
 * Variants:
 *   drawer — right-side panel on ≥768px, tall bottom sheet on phones (statement table)
 *   sheet  — bottom sheet on every size, drag the handle down to dismiss (kit, privacy)
 *   modal  — centered card on ≥640px, bottom sheet on phones (paywall)
 */
import { motion, useDragControls, useReducedMotion } from 'motion/react';
import type { PanInfo } from 'motion/react';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useLatest, useMediaQuery } from '../lib/hooks';
import { exitFast, spring } from '../lib/motion';

type Variant = 'drawer' | 'sheet' | 'modal';

interface Props {
  variant: Variant;
  onClose: () => void;
  /** id of the visible title element (aria-labelledby). */
  labelledBy: string;
  children: ReactNode;
  className?: string;
}

// DECISION(dismiss-threshold): dismiss on 120px of travel OR a 500px/s flick — a quick
// flick should close without dragging far (momentum, not distance).
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 500;

export function Dialog({ variant, onClose, labelledBy, children, className = '' }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useLatest(onClose);
  const reduce = useReducedMotion();
  const wide = useMediaQuery('(min-width: 768px)');
  const roomy = useMediaQuery('(min-width: 640px)');
  const drag = useDragControls();

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true });
    const onCancel = (e: Event) => {
      e.preventDefault();
      onCloseRef.current();
    };
    dialog.addEventListener('cancel', onCancel);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      if (dialog.open) dialog.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [onCloseRef]);

  const placement: 'right' | 'bottom' | 'center' =
    variant === 'drawer' && wide ? 'right' : variant === 'modal' && roomy ? 'center' : 'bottom';

  // Reduced motion: cross-fade only, no travel.
  const hidden = reduce
    ? { opacity: 0 }
    : placement === 'right'
      ? { x: '104%' }
      : placement === 'bottom'
        ? { y: '100%' }
        : { opacity: 0, scale: 0.96, y: 12 };
  const shown = placement === 'center' ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, x: 0, y: 0 };

  const panelShape = {
    right: 'right-2 top-2 bottom-2 w-[min(640px,calc(100vw-16px))] rounded-[22px] bg-paper',
    bottom: `inset-x-0 bottom-0 mx-auto w-full max-w-[640px] rounded-t-[26px] bg-card pb-[env(safe-area-inset-bottom,0px)] ${
      variant === 'drawer' ? 'h-[94dvh]' : 'max-h-[92dvh]'
    }`,
    center: 'inset-0 m-auto h-fit max-h-[88dvh] w-[min(560px,calc(100vw-32px))] rounded-[26px] bg-card',
  }[placement];

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-ink outline-none"
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-[rgb(20_22_19/0.32)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.25 } }}
        exit={{ opacity: 0, transition: exitFast }}
        onClick={onClose}
      />
      <motion.div
        className={`absolute flex flex-col overflow-hidden shadow-sheet ${panelShape} ${className}`}
        initial={hidden}
        animate={shown}
        exit={{ ...hidden, transition: { ...exitFast, duration: 0.24 } }}
        transition={placement === 'center' ? spring.enter : spring.sheet}
        drag={placement === 'bottom' && !reduce ? 'y' : false}
        dragListener={false}
        dragControls={drag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 0.9 }}
        onDragEnd={onDragEnd}
      >
        {placement === 'bottom' && (
          // The handle is the drag surface; the content keeps native scrolling.
          <div
            className="flex h-6 shrink-0 cursor-grab touch-none items-end justify-center active:cursor-grabbing"
            onPointerDown={(e) => drag.start(e)}
          >
            <span className="h-[5px] w-10 rounded-full bg-line-2" />
          </div>
        )}
        {children}
      </motion.div>
    </dialog>
  );
}

/** Standard header row for dialogs: title block + close button, also a drag surface. */
export function DialogHeader({
  id,
  title,
  eyebrow,
  children,
  onClose,
}: {
  id: string;
  title: ReactNode;
  eyebrow?: ReactNode;
  children?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="flex shrink-0 items-start gap-4 px-5 pt-3 pb-4 sm:px-6 sm:pt-5">
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h2 id={id} className="heading text-[20px] text-ink sm:text-[22px]">
          {title}
        </h2>
        {children}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="press press-sm -mt-0.5 -mr-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] text-ink-2 hover:bg-ink/[0.09] hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  );
}
