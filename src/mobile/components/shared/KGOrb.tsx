import { useCallback, useRef, useState, useEffect } from 'react';

/**
 * KG Orb — the city's living pulse.
 *
 * A breathing coral sphere with an SVG feTurbulence nebula interior.
 * Tap to ripple. Reduced-motion users get a static version.
 *
 * Phase 1 of the Orb View — core component.
 * Later phases will add: 6-hour conic ring, orbiting venue satellites,
 * Oracle Reveal tap animation.
 */
interface KGOrbProps {
  size?: number;
  cityName: string;
  cityPct: number;
  label?: string;
  onTap?: () => void;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function KGOrb({ size = 280, cityName, cityPct, label, onTap }: KGOrbProps) {
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

  const handleTap = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = nextId.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 800);
    onTap?.();
  }, [onTap]);

  // Pulse intensity — bright when city is busy, softer when quiet
  const pulseClass = cityPct > 70 ? 'kg-orb-pulse-high'
                  : cityPct > 40 ? 'kg-orb-pulse-mid'
                  : 'kg-orb-pulse-low';

  const stateLabel = cityPct > 70 ? 'Peak'
                   : cityPct > 40 ? 'Active'
                   : 'Calm';

  return (
    <div
      ref={wrapRef}
      className="kg-orb-wrap"
      style={{ width: size, height: size }}
    >
      {/* Aurora shell backdrop — slow drifting radial gradients */}
      <div className={`kg-orb-aurora ${reducedMotion ? 'kg-orb-static' : ''}`} aria-hidden="true" />

      {/* SVG nebula interior with feTurbulence */}
      <svg
        className="kg-orb-nebula"
        viewBox="0 0 300 300"
        width={size}
        height={size}
        aria-hidden="true"
      >
        <defs>
          <filter id="kgOrbNebula" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012"
              numOctaves="2"
              seed="4"
            >
              {!reducedMotion && (
                <animate
                  attributeName="baseFrequency"
                  values="0.012;0.020;0.012"
                  dur="14s"
                  repeatCount="indefinite"
                />
              )}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="32" />
            <feGaussianBlur stdDeviation="6" />
            <feColorMatrix
              type="matrix"
              values="
                1   0   0   0   0.85
                0   0.25 0.25 0  0.12
                0   0.15 0.25 0  0.18
                0   0    0   1   0
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
        <circle
          cx="150"
          cy="150"
          r="120"
          fill="url(#kgOrbCore)"
          filter="url(#kgOrbNebula)"
        />
      </svg>

      {/* Breathing glow core — sits over the nebula */}
      <div
        className={`kg-orb-core ${pulseClass} ${reducedMotion ? 'kg-orb-static' : ''}`}
        aria-hidden="true"
      />

      {/* Specular highlight — glossy top-left spot */}
      <div className="kg-orb-glint" aria-hidden="true" />

      {/* Tap-target button — invisible, covers the orb */}
      <button
        className="kg-orb-btn"
        onClick={handleTap}
        aria-label={`Consult the KG Orb — ${cityName} is currently ${stateLabel}`}
      >
        {/* Center label */}
        <div className="kg-orb-label">
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.18em] mb-1">
            {cityName}
          </p>
          <p className="font-syne text-[44px] font-black text-white leading-none tracking-[-0.03em]"
             style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
            {cityPct}%
          </p>
          <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.14em] mt-1">
            {label ?? stateLabel}
          </p>
        </div>

        {/* Tap ripples */}
        {ripples.map((r) => (
          <span
            key={r.id}
            className="kg-orb-ripple"
            style={{ left: r.x, top: r.y }}
          />
        ))}
      </button>
    </div>
  );
}
