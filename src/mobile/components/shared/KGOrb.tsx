import { useCallback, useEffect, useRef, useState } from 'react';
import type { Venue } from '../../types';

/**
 * KG Orb — the city's living pulse.
 *
 * Phase 1: breathing core + SVG nebula + tap ripple
 * Phase 2: 6-hour forecast ring + orbiting venue satellites (3 tiers)
 *
 * The orb core is `orbSize` wide; the wrap is larger so satellites can
 * orbit outside the core without clipping.
 */
interface KGOrbProps {
  orbSize?: number;
  cityName: string;
  cityPct: number;
  label?: string;
  forecast?: number[]; // 6 hourly predictions [0-100]
  satellites?: Venue[]; // venues to orbit
  onTap?: () => void;
  onSatelliteTap?: (venue: Venue) => void;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

/** Polar → Cartesian for arc paths */
function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** SVG arc path from startAngle→endAngle */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/** Color by crowd density */
function forecastColor(pct: number): string {
  if (pct < 40) return '#34d399'; // green
  if (pct < 70) return '#fbbf24'; // amber
  return '#ff4d6a'; // coral
}

/**
 * Orbit ring — renders a set of venue chips orbiting at a given radius.
 * Each chip has its wrapper rotation + counter-rotation staggered by animationDelay
 * so the chips stay upright while the ring slowly spins.
 */
function OrbitRing({
  radius,
  duration,
  reverse,
  chips,
  onTap,
}: {
  radius: number;
  duration: number;
  reverse?: boolean;
  chips: Venue[];
  onTap?: (venue: Venue) => void;
}) {
  if (chips.length === 0) return null;
  const spinName = reverse ? 'kg-orbit-spin-rev' : 'kg-orbit-spin';
  const counterName = reverse ? 'kg-orbit-counter-rev' : 'kg-orbit-counter';

  return (
    <>
      {chips.map((v, i) => {
        const delay = -(duration * i) / chips.length;
        const dot = v.crowd === 'busy' ? '#ff4d6a' : v.crowd === 'moderate' ? '#fbbf24' : '#34d399';
        return (
          <div
            key={v.id}
            className="kg-orbit-wrapper"
            style={{
              animation: `${spinName} ${duration}s linear infinite`,
              animationDelay: `${delay}s`,
            }}
          >
            <button
              className="kg-orbit-chip"
              style={{
                top: `${-radius - 18}px`,
                animation: `${counterName} ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onTap?.(v);
              }}
              aria-label={`View ${v.name}`}
            >
              <span className="kg-orbit-chip-icon">{v.icon}</span>
              <span className="kg-orbit-chip-dot" style={{ background: dot }} />
            </button>
          </div>
        );
      })}
    </>
  );
}

export function KGOrb({
  orbSize = 220,
  cityName,
  cityPct,
  label,
  forecast,
  satellites = [],
  onTap,
  onSatelliteTap,
}: KGOrbProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = nextId.current++;
      setRipples((prev) => [...prev, { id, x, y }]);
      window.setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 800);
      onTap?.();
    },
    [onTap],
  );

  // Wrap size gives room for orbit satellites + forecast ring
  const wrapSize = orbSize + 120; // 60px on each side for satellites
  const orbOffset = 60; // where core sits inside the wrap

  // Pulse state
  const pulseClass = cityPct > 70 ? 'kg-orb-pulse-high' : cityPct > 40 ? 'kg-orb-pulse-mid' : 'kg-orb-pulse-low';
  const stateLabel = cityPct > 70 ? 'Peak' : cityPct > 40 ? 'Active' : 'Calm';

  // Split satellites into 3 tiers by crowd level
  const busySats = satellites.filter((v) => v.crowd === 'busy').slice(0, 3);
  const moderateSats = satellites.filter((v) => v.crowd === 'moderate').slice(0, 3);
  const quietSats = satellites.filter((v) => v.crowd === 'quiet').slice(0, 3);

  // Forecast ring geometry
  const ringRadius = orbSize / 2 + 18;
  const ringCx = wrapSize / 2;
  const ringCy = wrapSize / 2;
  const safeForecast = (forecast && forecast.length > 0 ? forecast : [cityPct, cityPct, cityPct, cityPct, cityPct, cityPct]).slice(0, 6);
  while (safeForecast.length < 6) safeForecast.push(cityPct);

  return (
    <div ref={wrapRef} className="kg-orb-wrap" style={{ width: wrapSize, height: wrapSize }}>
      {/* Aurora backdrop */}
      <div
        className={`kg-orb-aurora ${reducedMotion ? 'kg-orb-static' : ''}`}
        aria-hidden="true"
        style={{ width: orbSize + 80, height: orbSize + 80, top: orbOffset - 40, left: orbOffset - 40 }}
      />

      {/* Orb core container — positioned centrally in the wrap */}
      <div
        className="kg-orb-core-wrap"
        style={{ width: orbSize, height: orbSize, top: orbOffset, left: orbOffset }}
      >
        {/* SVG nebula */}
        <svg
          className="kg-orb-nebula"
          viewBox="0 0 300 300"
          width={orbSize}
          height={orbSize}
          aria-hidden="true"
        >
          <defs>
            <filter id="kgOrbNebula" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="4">
                {!reducedMotion && (
                  <animate attributeName="baseFrequency" values="0.012;0.020;0.012" dur="14s" repeatCount="indefinite" />
                )}
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" scale="32" />
              <feGaussianBlur stdDeviation="6" />
              <feColorMatrix
                type="matrix"
                values="
                  1   0    0   0  0.85
                  0   0.25 0.25 0 0.12
                  0   0.15 0.25 0 0.18
                  0   0    0   1  0
                "
              />
            </filter>
            <radialGradient id="kgOrbCore" cx="35%" cy="35%" r="75%">
              <stop offset="0%" stopColor="#ffc3cf" />
              <stop offset="45%" stopColor="#ff4d6a" />
              <stop offset="85%" stopColor="#7a0520" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#2a0008" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="150" cy="150" r="120" fill="url(#kgOrbCore)" filter="url(#kgOrbNebula)" />
        </svg>

        {/* Breathing glow */}
        <div className={`kg-orb-core ${pulseClass} ${reducedMotion ? 'kg-orb-static' : ''}`} aria-hidden="true" />

        {/* Glint */}
        <div className="kg-orb-glint" aria-hidden="true" />

        {/* Tap button */}
        <button className="kg-orb-btn" onClick={handleTap} aria-label={`Consult the KG Orb — ${cityName}`}>
          <div className="kg-orb-label">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.18em] mb-1">{cityName}</p>
            <p
              className="font-syne text-[44px] font-black text-white leading-none tracking-[-0.03em]"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
            >
              {cityPct}%
            </p>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.14em] mt-1">
              {label ?? stateLabel}
            </p>
          </div>
          {ripples.map((r) => (
            <span key={r.id} className="kg-orb-ripple" style={{ left: r.x, top: r.y }} />
          ))}
        </button>
      </div>

      {/* 6-hour forecast ring — SVG arcs just outside the orb */}
      <svg
        className="kg-orb-ring"
        width={wrapSize}
        height={wrapSize}
        viewBox={`0 0 ${wrapSize} ${wrapSize}`}
        aria-hidden="true"
      >
        {safeForecast.map((pct, i) => {
          const startAngle = i * 60 - 3; // 6 slices, 3° gap
          const endAngle = startAngle + 54;
          const path = describeArc(ringCx, ringCy, ringRadius, startAngle, endAngle);
          return (
            <path
              key={i}
              d={path}
              stroke={forecastColor(pct)}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              opacity={0.9}
              style={{
                filter: `drop-shadow(0 0 4px ${forecastColor(pct)}80)`,
              }}
            />
          );
        })}
        {/* Hour tick marks */}
        {safeForecast.map((_, i) => {
          const angle = i * 60 + 27;
          const tickPos = polarToCartesian(ringCx, ringCy, ringRadius + 10, angle);
          return (
            <text
              key={`t-${i}`}
              x={tickPos.x}
              y={tickPos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="8"
              fontWeight="700"
              fill="rgba(255,255,255,0.5)"
              fontFamily="system-ui, sans-serif"
            >
              +{i + 1}h
            </text>
          );
        })}
      </svg>

      {/* Orbiting venue satellites — 3 tiers */}
      {!reducedMotion && (
        <div className="kg-orb-orbit-layer">
          {/* Outer ring — busy venues */}
          <OrbitRing radius={orbSize / 2 + 42} duration={65} chips={busySats} onTap={onSatelliteTap} />
          {/* Mid ring — moderate venues (reverse direction) */}
          <OrbitRing radius={orbSize / 2 + 34} duration={52} reverse chips={moderateSats} onTap={onSatelliteTap} />
          {/* Inner ring — quiet venues */}
          <OrbitRing radius={orbSize / 2 + 26} duration={40} chips={quietSats} onTap={onSatelliteTap} />
        </div>
      )}
    </div>
  );
}
