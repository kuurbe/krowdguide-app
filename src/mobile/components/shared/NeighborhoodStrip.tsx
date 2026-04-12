import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getNeighborhoodCrowd, crowdLevel, type Neighborhood } from '../../data/neighborhoods';
import { friendsByNeighborhood, type Friend } from '../../data/friends';
import { haptic } from '../../utils/haptics';

const LEVEL_COLOR: Record<string, string> = {
  quiet: 'var(--k-color-green)',
  moderate: 'var(--k-color-amber)',
  busy: 'var(--k-color-orange)',
  peak: 'var(--k-color-coral)',
};

const ROTATE_MS = 5000;
const PAUSE_MS = 10000;

export function NeighborhoodStrip({
  neighborhoods,
  selectedId,
  onSelect,
  friends = [],
}: {
  neighborhoods: Neighborhood[];
  selectedId: string | null;
  onSelect: (hood: Neighborhood | null) => void;
  friends?: Friend[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const pauseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Derive initial index from selectedId or default 0
  const initialIdx = neighborhoods.findIndex(n => n.id === selectedId);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, initialIdx));
  const [autoPlay, setAutoPlay] = useState(true);

  const friendMap = useMemo(() => friendsByNeighborhood(friends), [friends]);
  const activeHood = neighborhoods[activeIndex] ?? neighborhoods[0];

  // Auto-rotate
  useEffect(() => {
    if (!autoPlay || neighborhoods.length === 0) return;
    const id = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % neighborhoods.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [autoPlay, neighborhoods.length]);

  // Fire onSelect when active changes
  useEffect(() => {
    if (activeHood) onSelect(activeHood);
  }, [activeHood, onSelect]);

  // Scroll active pill into view
  useEffect(() => {
    if (!activeHood) return;
    const el = pillRefs.current.get(activeHood.id);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeHood]);

  const handleTap = useCallback((idx: number) => {
    haptic('light');
    setActiveIndex(idx);
    setAutoPlay(false);
    clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => setAutoPlay(true), PAUSE_MS);
  }, []);

  // Cleanup pause timer
  useEffect(() => () => clearTimeout(pauseTimer.current), []);

  if (neighborhoods.length === 0) return null;

  const pct = getNeighborhoodCrowd(activeHood);
  const level = crowdLevel(pct);
  const color = LEVEL_COLOR[level];
  const hoodFriends = friendMap.get(activeHood.id) ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="w-[6px] h-[6px] rounded-full bg-[var(--k-color-coral)] animate-pulse" />
        <span className="text-[11px] font-bold text-[var(--k-text-m)] uppercase tracking-wider">
          Neighborhoods
        </span>
      </div>

      {/* Pill strip */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2"
      >
        {neighborhoods.map((hood, idx) => {
          const isActive = idx === activeIndex;
          const hPct = getNeighborhoodCrowd(hood);
          const hLevel = crowdLevel(hPct);
          const hColor = LEVEL_COLOR[hLevel];

          return (
            <button
              key={hood.id}
              ref={(el) => { if (el) pillRefs.current.set(hood.id, el); }}
              onClick={() => handleTap(idx)}
              className={`
                flex-shrink-0 snap-center flex items-center gap-1.5 px-3 py-1.5
                rounded-full transition-all duration-200 ios-press whitespace-nowrap
                ${isActive
                  ? 'glass-chip-glow scale-[1.04]'
                  : 'glass-chip'
                }
              `}
              style={isActive ? {
                border: `1.5px solid ${hColor}`,
                boxShadow: `0 0 16px -4px ${hColor}55`,
              } : undefined}
            >
              <span className="text-[13px]">{hood.emoji}</span>
              <span className={`text-[11px] font-bold ${isActive ? 'text-[var(--k-text)]' : 'text-[var(--k-text-m)]'}`}>
                {hood.name}
              </span>
              <span
                className="text-[10px] font-black tabular-nums"
                style={{ color: isActive ? hColor : 'var(--k-text-f)' }}
              >
                {hPct}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail bar for active neighborhood */}
      <div
        key={activeHood.id}
        className="flex items-center gap-1.5 px-1 py-1 text-[10px] animate-in fade-in duration-200"
      >
        <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="font-bold uppercase tracking-wider" style={{ color }}>
          {level}
        </span>
        <span className="text-[var(--k-text-f)]">&middot;</span>
        <span className="text-[var(--k-text-m)] font-semibold">
          {activeHood.emoji} {activeHood.name}
        </span>
        {hoodFriends.length > 0 && (
          <>
            <span className="text-[var(--k-text-f)]">&middot;</span>
            <span className="text-[var(--k-text-m)]">
              {hoodFriends.length} friend{hoodFriends.length !== 1 ? 's' : ''} here
            </span>
          </>
        )}
        <span className="text-[var(--k-text-f)]">&middot;</span>
        <span className="text-[var(--k-text-f)]">{activeHood.venueCount} venues</span>
      </div>
    </div>
  );
}
