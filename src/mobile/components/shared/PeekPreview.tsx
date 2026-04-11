import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, ExternalLink, Activity, Users, Clock } from 'lucide-react';
import type { Venue } from '../../types';

interface PeekPreviewProps {
  venue: Venue | null;
  onClose: () => void;
  onOpenFull: (v: Venue) => void;
  onDirections: (v: Venue) => void;
}

/**
 * Full-screen peek overlay that renders a scaled preview of a venue
 * when the user long-presses a card. Tap the backdrop to dismiss.
 */
export function PeekPreview({
  venue,
  onClose,
  onOpenFull,
  onDirections,
}: PeekPreviewProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (venue) {
      setMounted(true);
      // next frame → trigger entrance transition
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
      const t = window.setTimeout(() => setMounted(false), 250);
      return () => window.clearTimeout(t);
    }
  }, [venue]);

  // ESC dismisses
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mounted, onClose]);

  if (!mounted || !venue) return null;
  if (typeof document === 'undefined') return null;

  const densityColor =
    venue.crowd === 'busy'
      ? 'var(--k-color-coral)'
      : venue.crowd === 'moderate'
        ? 'var(--k-color-amber)'
        : 'var(--k-color-green)';

  const densityLabel =
    venue.crowd === 'busy'
      ? 'Busy'
      : venue.crowd === 'moderate'
        ? 'Moderate'
        : 'Quiet';

  return createPortal(
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center px-6"
      style={{
        backdropFilter: visible ? 'blur(18px)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(18px)' : 'blur(0px)',
        backgroundColor: visible ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
        transition: 'backdrop-filter 250ms ease-out, background-color 250ms ease-out',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="liquid-glass glass-border-glow rounded-[28px] overflow-hidden w-full max-w-[360px] shadow-2xl"
        style={{
          transform: visible ? 'scale(1)' : 'scale(0.9)',
          opacity: visible ? 1 : 0,
          transition: 'transform 250ms ease-out, opacity 250ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="w-full h-[180px] bg-[var(--k-surface)] relative">
          {venue.image ? (
            <img
              src={venue.image}
              alt={venue.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-[var(--k-fill-3)]">
              {venue.icon}
            </div>
          )}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0) 55%)',
            }}
          />
          <span
            className="absolute top-3 right-3 glass-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ color: densityColor }}
          >
            <span
              className="w-[6px] h-[6px] rounded-full"
              style={{ backgroundColor: densityColor }}
            />
            {venue.pct}% {densityLabel}
          </span>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-5">
          <h3 className="font-syne text-[24px] font-extrabold text-[var(--k-text)] tracking-[-0.02em] leading-[1.1] truncate">
            {venue.name}
          </h3>
          <p className="text-[13px] text-[var(--k-text-m)] italic mt-1 truncate">
            {venue.type} &middot; {venue.dist}
          </p>

          {/* Quick stat row */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="glass-chip rounded-2xl px-2 py-2.5 text-center">
              <Users className="w-3.5 h-3.5 mx-auto text-[var(--k-color-coral)]" />
              <p className="type-overline text-[var(--k-text-f)] text-[8px] mt-1">
                DENSITY
              </p>
              <p className="text-[13px] font-bold text-[var(--k-text)]">
                {venue.pct}%
              </p>
            </div>
            <div className="glass-chip rounded-2xl px-2 py-2.5 text-center">
              <Activity className="w-3.5 h-3.5 mx-auto text-[var(--k-color-green)]" />
              <p className="type-overline text-[var(--k-text-f)] text-[8px] mt-1">
                VIBE
              </p>
              <p className="text-[13px] font-bold text-[var(--k-text)] capitalize">
                {venue.crowd}
              </p>
            </div>
            <div className="glass-chip rounded-2xl px-2 py-2.5 text-center">
              <Clock className="w-3.5 h-3.5 mx-auto text-[var(--k-color-amber)]" />
              <p className="type-overline text-[var(--k-text-f)] text-[8px] mt-1">
                WAIT
              </p>
              <p className="text-[13px] font-bold text-[var(--k-text)]">
                {venue.wait ?? '—'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onOpenFull(venue)}
              className="flex-1 rounded-2xl py-3 text-[13px] font-bold text-white flex items-center justify-center gap-1.5 ios-press"
              style={{ backgroundColor: 'var(--k-accent)' }}
            >
              <ExternalLink className="w-4 h-4" />
              Open Full
            </button>
            <button
              onClick={() => onDirections(venue)}
              className="flex-1 glass-chip rounded-2xl py-3 text-[13px] font-bold text-[var(--k-text)] flex items-center justify-center gap-1.5 ios-press"
            >
              <MapPin className="w-4 h-4" />
              Walk Here
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
