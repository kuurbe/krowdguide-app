import { useMemo } from 'react';
import { useAppContext } from '../../context';
import { getVenuesForCity } from '../../data/venues';

export function MapLegend() {
  const { selectedCity } = useAppContext();

  const nearbyCount = useMemo(() => {
    const venues = getVenuesForCity(selectedCity.id);
    // Sum up crowd-based "people nearby" from venue pct data (anonymous crowd intelligence)
    return venues.reduce((sum, v) => sum + Math.round(v.pct * 0.4), 0);
  }, [selectedCity.id]);

  return (
    <div className="absolute bottom-20 left-4 z-[1000] p-3 rounded-[16px] bg-[var(--k-elevated)] ios-blur-thick
                    border border-[var(--k-border)] shadow-[var(--k-float-shadow)]">
      <p className="text-[9px] font-bold text-[var(--k-text-f)] uppercase tracking-[0.08em] mb-1.5">Crowd Density</p>
      <div
        className="w-[110px] h-[6px] rounded-full"
        style={{ background: 'linear-gradient(to right, var(--k-color-green), #facc15, #f59e0b, var(--k-color-coral))' }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[8px] font-bold text-emerald-400/60">Low</span>
        <span className="text-[8px] font-bold text-[var(--k-color-coral)]/60">High</span>
      </div>

      {/* Crowd Pulse — social presence indicator */}
      <div className="mt-2 pt-2 border-t border-[var(--k-border-s)]">
        <div className="flex items-center gap-2">
          {/* Overlapping colored circles */}
          <div className="flex items-center -space-x-1.5">
            <div className="w-[14px] h-[14px] rounded-full bg-[var(--k-color-coral)] border-[1.5px] border-[var(--k-elevated)]" />
            <div className="w-[14px] h-[14px] rounded-full bg-[var(--k-color-purple)] border-[1.5px] border-[var(--k-elevated)]" />
            <div className="w-[14px] h-[14px] rounded-full bg-[var(--k-color-cyan)] border-[1.5px] border-[var(--k-elevated)]" />
          </div>
          <span className="text-[10px] font-bold text-[var(--k-text-2)]">
            {nearbyCount} nearby
          </span>
        </div>
      </div>
    </div>
  );
}
