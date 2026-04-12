import { useMemo } from 'react';
import type { Venue } from '../../types';

/**
 * VibeRadar — 4-axis radar chart showing venue vibe.
 * Axes: Energy, Noise, Age-mix, Wait.
 * Replaces single "density %" with multi-dimensional read.
 */
export function VibeRadar({ venue, size = 140 }: { venue: Venue; size?: number }) {
  const axes = useMemo(() => {
    // Deterministic jitter per venue for consistent "personality"
    const seed = venue.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = (n: number) => ((Math.sin(seed + n) + 1) / 2); // 0..1

    // Energy correlates with crowd level
    const energy = venue.pct / 100;
    // Noise: bars/clubs louder, cafes quieter — derive from type + pct
    const isLoud = /bar|club|brewery|lounge/i.test(venue.type);
    const noise = isLoud ? 0.5 + energy * 0.5 : 0.2 + energy * 0.4;
    // Age-mix — venue-dependent character
    const ageMix = 0.3 + rand(1) * 0.6;
    // Wait — proxy for popularity vs capacity
    const wait = venue.wait ? 0.7 + rand(2) * 0.25 : energy * 0.6;

    return [
      { label: 'Energy', value: energy, color: 'var(--k-color-coral)' },
      { label: 'Noise', value: noise, color: 'var(--k-color-orange)' },
      { label: 'Mix', value: ageMix, color: 'var(--k-color-purple)' },
      { label: 'Wait', value: wait, color: 'var(--k-color-amber)' },
    ];
  }, [venue]);

  // Calculate polygon points
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;

  const points = axes.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const r = radius * axis.value;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, axis };
  });

  const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

  // Axis endpoints (full radius)
  const axisEnds = axes.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      label: axis.label,
      angle,
    };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {[0.33, 0.66, 1].map((r, i) => (
          <polygon
            key={i}
            points={axes.map((_, j) => {
              const angle = (Math.PI * 2 * j) / axes.length - Math.PI / 2;
              return `${cx + Math.cos(angle) * radius * r},${cy + Math.sin(angle) * radius * r}`;
            }).join(' ')}
            fill="none"
            stroke="var(--k-border)"
            strokeWidth="0.8"
          />
        ))}

        {/* Axis lines */}
        {axisEnds.map((end, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="var(--k-border)"
            strokeWidth="0.8"
          />
        ))}

        {/* Data polygon with coral fill */}
        <polygon
          points={pointsStr}
          fill="rgba(255, 77, 106, 0.2)"
          stroke="#ff4d6a"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Vertex dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill={p.axis.color}
            stroke="white"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* Axis labels (positioned outside the polygon) */}
      {axisEnds.map((end, i) => {
        const labelDist = radius + 14;
        const lx = cx + Math.cos(end.angle) * labelDist;
        const ly = cy + Math.sin(end.angle) * labelDist;
        return (
          <span
            key={i}
            className="absolute text-[9px] font-bold text-[var(--k-text-m)] uppercase tracking-[0.05em] pointer-events-none"
            style={{
              left: lx,
              top: ly,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {end.label}
          </span>
        );
      })}
    </div>
  );
}
