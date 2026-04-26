import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Layers, Bus, Bike, Zap, Timer, Accessibility } from 'lucide-react';
import { useMapLayers } from '../../hooks/useMapLayers';
import type { DataLayerType } from '../../types';

const LAYER_OPTIONS: { id: DataLayerType; icon: typeof Bus; label: string; color: string }[] = [
  { id: 'transit',       icon: Bus,           label: 'Transit',     color: '#3b82f6' },
  { id: 'bikes',         icon: Bike,          label: 'Bikes',       color: '#22c55e' },
  { id: 'ev',            icon: Zap,           label: 'EV',          color: 'var(--k-color-cyan)' },
  { id: 'accessibility', icon: Accessibility, label: 'Access',      color: 'var(--k-color-purple)' },
  { id: 'isochrone',     icon: Timer,         label: 'Walk Range',  color: '#f97316' },
];

export function LayerSelector() {
  const [expanded, setExpanded] = useState(false);
  const { toggleLayer, isLayerActive, activeLayers } = useMapLayers();
  const pillsRef = useRef<HTMLDivElement>(null);

  // GSAP stagger animation on expand/collapse
  useEffect(() => {
    if (!pillsRef.current) return;
    const pills = pillsRef.current.children;

    if (expanded) {
      gsap.fromTo(pills,
        { opacity: 0, x: -12, scale: 0.8 },
        { opacity: 1, x: 0, scale: 1, stagger: 0.04, duration: 0.3, ease: 'back.out(1.4)' },
      );
    } else {
      gsap.to(pills,
        { opacity: 0, x: -12, scale: 0.8, stagger: 0.02, duration: 0.15, ease: 'power2.in' },
      );
    }
  }, [expanded]);

  const activeCount = activeLayers.length;

  return (
    <div className="absolute bottom-[88px] left-4 z-[1040] flex flex-col items-start gap-2">
      {/* Expanded panel — layers + crowd legend */}
      {expanded && (
        <div ref={pillsRef} className="flex flex-col gap-1.5 mb-1">
          {/* Layer toggles */}
          {LAYER_OPTIONS.map(({ id, icon: Icon, label, color }) => {
            const active = isLayerActive(id);
            return (
              <button
                key={id}
                onClick={() => toggleLayer(id)}
                className={`flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full text-[10px] font-bold
                           transition-all ios-press whitespace-nowrap
                           ${active
                             ? 'text-white shadow-lg'
                             : 'glass-chip text-[var(--k-text-m)] hover:bg-[var(--k-surface-h)]'
                           }`}
                style={active ? {
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  boxShadow: `0 4px 16px ${color}40`,
                } : undefined}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}

        </div>
      )}

      {/* FAB toggle button */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className={`w-[44px] h-[44px] rounded-full flex items-center justify-center
                   transition-all ios-press relative
                   ${expanded
                     ? 'bg-[var(--k-accent)] text-white shadow-[0_4px_20px_rgba(104,219,174,0.35)]'
                     : 'liquid-glass text-[var(--k-text-m)] shadow-[var(--k-shadow-md)]'
                   }`}
        aria-label={expanded ? 'Close layers' : 'Map layers & legend'}
      >
        <Layers className="w-[18px] h-[18px]" />

        {/* Active layer count badge */}
        {!expanded && activeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-[16px] h-[16px] rounded-full bg-[var(--k-accent)]
                          text-white text-[8px] font-black flex items-center justify-center
                          ring-2 ring-[var(--k-bg)]">
            {activeCount}
          </span>
        )}
      </button>
    </div>
  );
}
