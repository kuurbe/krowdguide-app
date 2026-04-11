import { useCallback, useEffect, useRef } from 'react';
import { haptic } from '../utils/haptics';

/**
 * Detects a long-press (hold) gesture on an element.
 *
 * Usage:
 *   const handlers = usePressHold((x, y) => setPeek({ x, y }));
 *   <button {...handlers}>...</button>
 *
 * On pointerdown a timer starts. If the pointer is released or leaves
 * before `delay` ms elapses, the timer is cancelled. Otherwise a medium
 * haptic fires and `onHold` is called with the pointer's client coords.
 */
export function usePressHold(
  onHold: (x: number, y: number) => void,
  delay = 500,
) {
  const timerRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);
  const onHoldRef = useRef(onHold);

  useEffect(() => {
    onHoldRef.current = onHold;
  }, [onHold]);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clear(), [clear]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      triggeredRef.current = false;
      const x = e.clientX;
      const y = e.clientY;
      clear();
      timerRef.current = window.setTimeout(() => {
        triggeredRef.current = true;
        timerRef.current = null;
        haptic('medium');
        onHoldRef.current(x, y);
      }, delay);
    },
    [clear, delay],
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
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    onClickCapture,
  };
}
