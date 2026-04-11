import { useState, useRef, useCallback, useMemo } from 'react';
import { Heart, X, Navigation, RotateCcw } from 'lucide-react';
import type { Venue } from '../../types';

interface SwipeStackProps {
  venues: Venue[];
  onSave: (venue: Venue) => void;
  onSkip: (venue: Venue) => void;
  onDirections: (venue: Venue) => void;
  onExit: () => void;
}

type ExitDir = 'left' | 'right' | 'up' | null;

const SWIPE_THRESHOLD = 90;

export function SwipeStack({ venues, onSave, onSkip, onDirections }: SwipeStackProps) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [exiting, setExiting] = useState<ExitDir>(null);
  const startRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const draggingRef = useRef(false);

  const visibleStack = useMemo(() => venues.slice(index, index + 3), [venues, index]);
  const currentVenue = visibleStack[0];

  const commit = useCallback(
    (dir: Exclude<ExitDir, null>) => {
      if (!currentVenue || exiting) return;
      setExiting(dir);
      // trigger side effect
      if (dir === 'right') onSave(currentVenue);
      else if (dir === 'left') onSkip(currentVenue);
      else if (dir === 'up') onDirections(currentVenue);

      window.setTimeout(() => {
        setIndex((i) => i + 1);
        setDrag({ x: 0, y: 0 });
        setExiting(null);
      }, 320);
    },
    [currentVenue, exiting, onSave, onSkip, onDirections]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (exiting) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    draggingRef.current = true;
  }, [exiting]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    setDrag({ x: dx, y: dy });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const { x, y } = drag;
    startRef.current = null;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }

    // Up swipe takes priority if mostly vertical
    if (y < -SWIPE_THRESHOLD && Math.abs(y) > Math.abs(x)) {
      commit('up');
      return;
    }
    if (x > SWIPE_THRESHOLD) {
      commit('right');
      return;
    }
    if (x < -SWIPE_THRESHOLD) {
      commit('left');
      return;
    }
    // spring back
    setDrag({ x: 0, y: 0 });
  }, [drag, commit]);

  const reset = useCallback(() => {
    setIndex(0);
    setDrag({ x: 0, y: 0 });
    setExiting(null);
  }, []);

  // End state
  if (!currentVenue) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 rounded-full glass-chip flex items-center justify-center mb-4">
          <Heart className="w-7 h-7 text-[var(--k-color-coral)]" />
        </div>
        <p className="font-syne text-[22px] font-extrabold text-[var(--k-text)] tracking-[-0.02em] text-center">
          You&apos;ve seen them all!
        </p>
        <p className="text-[13px] text-[var(--k-text-f)] mt-1 text-center">
          Come back later for fresh spots.
        </p>
        <button
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-chip text-[13px] font-bold text-[var(--k-text)] ios-press"
        >
          <RotateCcw className="w-4 h-4" />
          Reset stack
        </button>
      </div>
    );
  }

  // Drag-derived style helpers
  const rot = drag.x * 0.06;
  const rightOpacity = Math.min(1, Math.max(0, drag.x / SWIPE_THRESHOLD));
  const leftOpacity = Math.min(1, Math.max(0, -drag.x / SWIPE_THRESHOLD));
  const upOpacity = Math.min(1, Math.max(0, -drag.y / SWIPE_THRESHOLD));

  // Flash color based on dominant direction
  const dominantFlash =
    exiting === 'right'
      ? 'rgba(52, 211, 153, 0.35)'
      : exiting === 'left'
        ? 'rgba(255, 77, 106, 0.35)'
        : exiting === 'up'
          ? 'rgba(34, 211, 238, 0.35)'
          : 'transparent';

  const getExitTransform = (dir: ExitDir) => {
    if (dir === 'right') return 'translate3d(140%, 40px, 0) rotate(24deg)';
    if (dir === 'left') return 'translate3d(-140%, 40px, 0) rotate(-24deg)';
    if (dir === 'up') return 'translate3d(0, -120%, 0) rotate(0deg)';
    return `translate3d(${drag.x}px, ${drag.y}px, 0) rotate(${rot}deg)`;
  };

  return (
    <div className="relative select-none">
      {/* Stack area */}
      <div className="relative h-[460px] w-full">
        {visibleStack
          .slice()
          .reverse()
          .map((venue, revIdx) => {
            const stackIdx = visibleStack.length - 1 - revIdx; // 0 = top
            const isTop = stackIdx === 0;
            const depth = stackIdx;
            const scale = 1 - depth * 0.05;
            const translateY = depth * 10;

            const baseStyle: React.CSSProperties = isTop
              ? {
                  transform: getExitTransform(exiting),
                  transition: exiting || !draggingRef.current
                    ? 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease'
                    : 'none',
                  zIndex: 30,
                  willChange: 'transform',
                }
              : {
                  transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
                  transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                  zIndex: 10 - depth,
                  opacity: 1 - depth * 0.15,
                };

            return (
              <div
                key={`${venue.id}-${index + stackIdx}`}
                onPointerDown={isTop ? handlePointerDown : undefined}
                onPointerMove={isTop ? handlePointerMove : undefined}
                onPointerUp={isTop ? handlePointerUp : undefined}
                onPointerCancel={isTop ? handlePointerUp : undefined}
                className="absolute inset-0 rounded-3xl liquid-glass overflow-hidden touch-none cursor-grab active:cursor-grabbing"
                style={baseStyle}
              >
                <CardContent
                  venue={venue}
                  rightOpacity={isTop ? rightOpacity : 0}
                  leftOpacity={isTop ? leftOpacity : 0}
                  upOpacity={isTop ? upOpacity : 0}
                  flashColor={isTop ? dominantFlash : 'transparent'}
                />
              </div>
            );
          })}
      </div>

      {/* Bottom action buttons */}
      <div className="flex items-center justify-center gap-5 mt-5">
        <button
          onClick={() => commit('left')}
          className="w-14 h-14 rounded-full glass-chip flex items-center justify-center ios-press"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 77, 106, 0.4)' }}
          aria-label="Skip"
        >
          <X className="w-6 h-6 text-[#ff4d6a]" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => commit('up')}
          className="w-12 h-12 rounded-full glass-chip flex items-center justify-center ios-press"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(34, 211, 238, 0.4)' }}
          aria-label="Directions"
        >
          <Navigation className="w-5 h-5 text-[#22d3ee]" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => commit('right')}
          className="w-14 h-14 rounded-full glass-chip flex items-center justify-center ios-press"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(52, 211, 153, 0.5)' }}
          aria-label="Save"
        >
          <Heart className="w-6 h-6 text-[#34d399]" fill="#34d399" strokeWidth={2} />
        </button>
      </div>

      {/* Remaining counter */}
      <p className="text-center text-[10px] text-[var(--k-text-f)] uppercase tracking-widest mt-3">
        {venues.length - index} left &middot; swipe or tap
      </p>
    </div>
  );
}

function CardContent({
  venue,
  rightOpacity,
  leftOpacity,
  upOpacity,
  flashColor,
}: {
  venue: Venue;
  rightOpacity: number;
  leftOpacity: number;
  upOpacity: number;
  flashColor: string;
}) {
  const densityColor =
    venue.crowd === 'quiet'
      ? 'var(--k-color-green)'
      : venue.crowd === 'moderate'
        ? 'var(--k-color-amber)'
        : 'var(--k-color-coral)';

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Image */}
      <div className="relative w-full h-[300px] flex-shrink-0 bg-[var(--k-fill-3)]">
        {venue.image ? (
          <img
            src={venue.image}
            alt={venue.name}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">{venue.icon}</div>
        )}

        {/* Gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)' }}
        />

        {/* Popular tag */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full glass-chip">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--k-color-coral)]">Popular</p>
        </div>

        {/* Ghost badge: SAVE (right) */}
        <div
          className="absolute top-5 left-5 px-3 py-2 rounded-xl flex items-center gap-1.5 pointer-events-none"
          style={{
            opacity: rightOpacity,
            transform: `rotate(-12deg) scale(${0.9 + rightOpacity * 0.15})`,
            border: '2.5px solid #34d399',
            background: 'rgba(52, 211, 153, 0.18)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Heart className="w-4 h-4 text-[#34d399]" fill="#34d399" />
          <span className="text-[14px] font-extrabold text-[#34d399] tracking-wider">SAVE</span>
        </div>

        {/* Ghost badge: SKIP (left) */}
        <div
          className="absolute top-5 right-5 px-3 py-2 rounded-xl flex items-center gap-1.5 pointer-events-none"
          style={{
            opacity: leftOpacity,
            transform: `rotate(12deg) scale(${0.9 + leftOpacity * 0.15})`,
            border: '2.5px solid #ff4d6a',
            background: 'rgba(255, 77, 106, 0.18)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <X className="w-4 h-4 text-[#ff4d6a]" strokeWidth={3} />
          <span className="text-[14px] font-extrabold text-[#ff4d6a] tracking-wider">SKIP</span>
        </div>

        {/* Ghost badge: GO (up) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-2 rounded-xl flex items-center gap-1.5 pointer-events-none"
          style={{
            opacity: upOpacity,
            transform: `translate(-50%, -50%) scale(${0.9 + upOpacity * 0.2})`,
            border: '2.5px solid #22d3ee',
            background: 'rgba(34, 211, 238, 0.18)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Navigation className="w-4 h-4 text-[#22d3ee]" fill="#22d3ee" />
          <span className="text-[14px] font-extrabold text-[#22d3ee] tracking-wider">GO</span>
        </div>
      </div>

      {/* Text content */}
      <div className="flex-1 px-4 pt-3 pb-4 flex flex-col justify-between">
        <div>
          <h3 className="font-syne text-[24px] font-extrabold text-[var(--k-text)] leading-tight tracking-[-0.02em] truncate">
            {venue.name}
          </h3>
          <p className="text-[13px] text-[var(--k-text-m)] italic mt-0.5 truncate">{venue.type}</p>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span
            className="glass-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ color: densityColor }}
          >
            <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: densityColor }} />
            {venue.pct}%
          </span>
          <span className="glass-chip inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold text-[var(--k-text-m)]">
            {venue.dist}
          </span>
        </div>
      </div>

      {/* Exit flash */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundColor: flashColor,
          opacity: flashColor === 'transparent' ? 0 : 1,
        }}
      />
    </div>
  );
}
