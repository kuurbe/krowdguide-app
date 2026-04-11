import { useCallback, useEffect, useRef } from 'react';
import { haptic } from '../utils/haptics';

/**
 * Detects a long-press (hold) gesture on an element.
 *
 * Usage:
 *   const handlers = usePressHold((x, y) => setPeek({ x, y }));
 *   <button {...handlers}>...</button>
 *
 * Cancels if:
 * - pointerup / pointerleave / pointercancel before delay
 * - pointer moves more than 10px (user is scrolling, not holding)
 */
export function usePressHold(
  onHold: (x: number, y: number) => void,
  delay = 500,
) {
  const timerRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const onHoldRef = useRef(onHold);

  useEffect(() => {
    onHoldRef.current = onHold;
  }, [onHold]);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  }, []);

  useEffect(() => () => clear(), [clear]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      triggeredRef.current = false;
      const x = e.clientX;
      const y = e.clientY;
      startRef.current = { x, y };
      clear();
      startRef.current = { x, y };
      timerRef.current = window.setTimeout(() => {
        triggeredRef.current = true;
        timerRef.current = null;
        haptic('medium');
        onHoldRef.current(x, y);
      }, delay);
    },
    [clear, delay],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current || timerRef.current === null) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      // If user moves more than 10px, they're scrolling — cancel hold
      if (dx * dx + dy * dy > 100) {
        clear();
      }
    },
    [clear],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      // If hold already triggered, suppress the follow-up click.
      if (triggeredRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
      clear();
    },
    [clear],
  );

  const onPointerLeave = useCallback(() => {
    clear();
  }, [clear]);

  const onPointerCancel = useCallback(() => {
    clear();
  }, [clear]);

  // Suppress click after a successful hold so the button's onClick
  // doesn't fire on release.
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (triggeredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      triggeredRef.current = false;
    }
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    onClickCapture,
  };
}
