import { useMemo } from 'react';
import type { Neighborhood } from '../../data/neighborhoods';
import { getNeighborhoodCrowd, crowdLevel } from '../../data/neighborhoods';

/**
 * NeighborhoodGrid — 3×2 grid of neighborhood tiles that pulse with live crowd density.
 * Each tile is tappable to filter the venue feed below.
 */
interface Props {
  neighborhoods: Neighborhood[];
  selectedId?: string | null;
  onSelect?: (hood: Neighborhood | null) => void;
}

const LEVEL_COLOR: Record<ReturnType<typeof crowdLevel>, string> = {
  quiet: '#34d399',
  moderate: '#fbbf24',
  busy: '#ff8c42',
  peak: '#ff4d6a',
};

const LEVEL_LABEL: Record<ReturnType<typeof crowdLevel>, string> = {
  quiet: 'Calm',
  moderate: 'Warm',
  busy: 'Hot',
  peak: 'Peak',
};

export function NeighborhoodGrid({ neighborhoods, selectedId, onSelect }: Props) {
  const hoodsWithCrowd = useMemo(() =>
    neighborhoods.map(h => {
      const crowd = getNeighborhoodCrowd(h);
      return { ...h, crowd, level: crowdLevel(crowd) };
    }),
    [neighborhoods],
  );

  // How many are "hot" or "peak" right now
  const hotCount = hoodsWithCrowd.filter(h => h.level === 'busy' || h.level === 'peak').length;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--k-color-coral)] animate-pulse" />
          <p className="type-overline text-[var(--k-text-m)] text-[9px]">Neighborhoods Live</p>
        </div>
        <p className="text-[10px] font-bold text-[var(--k-text-m)]">
          <span className="text-[var(--k-color-coral)]">{hotCount}</span> hot now
        </p>
      </div>

      {/* 3×2 grid */}
      <div className="grid grid-cols-3 gap-2">
        {hoodsWithCrowd.map(h => {
          const color = LEVEL_COLOR[h.level];
          const isSelected = selectedId === h.id;
          return (
            <button
              key={h.id}
              onClick={() => onSelect?.(isSelected ? null : h)}
              className={`
                relative overflow-hidden rounded-[14px] p-2.5 text-left ios-press transition-all
                ${isSelected ? 'scale-[0.98]' : ''}
              `}
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${color}25, ${color}08)`
                  : 'var(--k-glass-bg)',
                border: isSelected
                  ? `1.5px solid ${color}`
                  : '1px solid var(--k-glass-border)',
                boxShadow: isSelected
                  ? `0 0 24px ${color}40, inset 0 1px 0 rgba(255,255,255,0.08)`
                  : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                backdropFilter: 'blur(16px) saturate(160%)',
                WebkitBackdropFilter: 'blur(16px) saturate(160%)',
              }}
            >
              {/* Pulse glow behind the emoji — speed depends on level */}
              <div
                className="absolute -top-3 -right-3 w-14 h-14 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${color}50 0%, transparent 70%)`,
                  filter: 'blur(8px)',
                  animation: `nh-pulse ${h.level === 'peak' ? 1.8 : h.level === 'busy' ? 2.4 : h.level === 'moderate' ? 3.2 : 4.5}s ease-in-out infinite`,
                }}
              />

              {/* Emoji */}
              <span className="text-[22px] block relative leading-none">{h.emoji}</span>

              {/* Name */}
              <p className="text-[12px] font-bold text-[var(--k-text)] mt-1.5 truncate relative">
                {h.name}
              </p>

              {/* Crowd % + level */}
              <div className="flex items-center justify-between mt-1 relative">
                <span className="font-syne text-[13px] font-black" style={{ color }}>
                  {h.crowd}%
                </span>
                <span
                  className="text-[8px] font-black uppercase tracking-[0.06em]"
                  style={{ color }}
                >
                  {LEVEL_LABEL[h.level]}
                </span>
              </div>

              {/* Density bar at bottom */}
              <div className="mt-1 h-[2px] rounded-full bg-[var(--k-fill-3)] overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${h.crowd}%`, background: color }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
