import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Footprints, X } from 'lucide-react';
import { haptic } from '../../utils/haptics';
import type { Venue } from '../../types';

/**
 * LeaveNowToast — smart nudge that appears when a recommended
 * venue's "best window" is opening within the next 5 minutes.
 *
 * Fires a heavy haptic on appear, auto-dismisses after 12 seconds,
 * or tap to act on the nudge.
 */

interface Nudge {
  id: string;
  venue: Venue;
  message: string;
  windowEnds: string; // e.g. "8:30pm"
}

interface Props {
  venues: Venue[];
  onAct: (venue: Venue) => void;
  enabled?: boolean;
}

export function LeaveNowToast({ venues, onAct, enabled = true }: Props) {
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [visible, setVisible] = useState(false);
  const dismissedIds = useRef<Set<string>>(new Set());
  const autoTimer = useRef<number | null>(null);

  // Check every 60s for a nudge-worthy window
  useEffect(() => {
    if (!enabled || venues.length === 0) return;

    const checkNudges = () => {
      // Find a quiet venue that would benefit from "leave now" — mock logic:
      // pick the quietest venue (<40%) with highest rating, fire once per venue per session
      const candidate = venues
        .slice()
        .filter(v => v.pct < 45)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];

      if (!candidate || dismissedIds.current.has(candidate.id)) return;
      if (nudge?.id === candidate.id) return;

      // Generate a window end time — 30 min from now for demo purposes
      const end = new Date(Date.now() + 30 * 60_000);
      const hh = end.getHours();
      const mm = end.getMinutes();
      const ampm = hh >= 12 ? 'pm' : 'am';
      const hour12 = hh % 12 || 12;
      const windowEnds = `${hour12}:${mm.toString().padStart(2, '0')}${ampm}`;

      setNudge({
        id: candidate.id,
        venue: candidate,
        message: `Best window to reach ${candidate.name} ends at ${windowEnds}. Leave now — it's 4 min away.`,
        windowEnds,
      });
    };

    // Fire once on mount (after 8s delay so user sees the app first)
    const initial = window.setTimeout(checkNudges, 8000);
    // Then check every 90 seconds
    const interval = window.setInterval(checkNudges, 90_000);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [venues, enabled, nudge?.id]);

  // When a nudge is set, show it with haptic + auto-dismiss
  useEffect(() => {
    if (!nudge) {
      setVisible(false);
      return;
    }
    // Small delay so fade-in is visible
    requestAnimationFrame(() => setVisible(true));
    haptic('heavy');

    autoTimer.current = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(() => setNudge(null), 300);
    }, 12_000);

    return () => {
      if (autoTimer.current) window.clearTimeout(autoTimer.current);
    };
  }, [nudge]);

  const handleAct = () => {
    if (!nudge) return;
    dismissedIds.current.add(nudge.id);
    haptic('light');
    onAct(nudge.venue);
    setVisible(false);
    window.setTimeout(() => setNudge(null), 300);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nudge) return;
    dismissedIds.current.add(nudge.id);
    haptic('light');
    setVisible(false);
    window.setTimeout(() => setNudge(null), 300);
  };

  if (!nudge || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed left-0 right-0 z-[2400] flex justify-center px-4 pointer-events-none"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 60px)',
        transform: visible ? 'translateY(0)' : 'translateY(-20px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1), opacity 300ms ease',
      }}
    >
      <button
        onClick={handleAct}
        className="pointer-events-auto liquid-glass glass-border-glow rounded-2xl px-4 py-3 flex items-center gap-3 max-w-sm w-full text-left ios-press"
        style={{
          boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 32px rgba(255,77,106,0.3)',
        }}
      >
        {/* Live pulse indicator */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative"
             style={{ background: 'rgba(255,77,106,0.15)', border: '1px solid rgba(255,77,106,0.35)' }}>
          <Footprints className="w-5 h-5 text-[var(--k-color-coral)]" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--k-color-coral)] animate-pulse" />
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="type-overline text-[var(--k-color-coral)] text-[9px] mb-0.5">Leave Now</p>
          <p className="text-[12px] text-[var(--k-text)] leading-snug font-semibold truncate">
            {nudge.venue.name}
          </p>
          <p className="text-[10px] text-[var(--k-text-m)] leading-snug truncate">
            Best window ends {nudge.windowEnds} · 4 min away
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="w-6 h-6 rounded-full flex items-center justify-center ios-press flex-shrink-0"
          aria-label="Dismiss nudge"
        >
          <X className="w-3 h-3 text-[var(--k-text-m)]" />
        </button>
      </button>
    </div>,
    document.body
  );
}
