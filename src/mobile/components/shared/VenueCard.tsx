import type { Venue } from '../../types';
import { CrowdPill } from './CrowdPill';
import { ShieldCheck, Navigation } from 'lucide-react';
import { useAppContext } from '../../context';

export function VenueCard({ venue, verified }: { venue: Venue; verified?: boolean }) {
  const { startDirections } = useAppContext();
  const isOracle = venue.id.startsWith('oracle-');
  const crowdColor = venue.crowd === 'busy' ? 'var(--k-color-coral)' : venue.crowd === 'moderate' ? 'var(--k-color-amber)' : 'var(--k-color-green)';

  return (
    <div
      className={`flex gap-4 p-4 rounded-2xl bg-[var(--k-surface-solid)] border ios-press transition-all
                  shadow-[var(--k-shadow-sm)] ${isOracle ? 'border-emerald-500/20 ring-1 ring-emerald-500/[0.06]' : 'border-[var(--k-border)]'}`}
      style={{ borderLeftWidth: 2, borderLeftColor: `${crowdColor}30` }}
    >
      <div className="relative w-16 h-16 rounded-2xl bg-[var(--k-surface)] overflow-hidden flex-shrink-0">
        <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" loading="lazy" />
        {isOracle && (
          <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-emerald-500 flex items-center justify-center border-[1.5px] border-[var(--k-surface-solid)]">
            <ShieldCheck className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="type-title-3 truncate text-[var(--k-text)] leading-tight">{venue.icon} {venue.name}</h4>
          <CrowdPill crowd={venue.crowd} pct={venue.pct} />
        </div>
        <p className="text-[12px] text-[var(--k-text-m)] mt-0.5 leading-tight">{venue.type} · {venue.dist}</p>
        {venue.wait && (
          <p className="text-[12px] text-amber-400 mt-1 font-semibold">⏱️ ~{venue.wait}</p>
        )}
        {venue.hasHH && (
          <p className="text-[12px] text-[var(--k-color-orange)] mt-1 font-semibold">🍺 HH: {venue.hhDeal}</p>
        )}
        {(isOracle || verified) && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full bg-emerald-500/[0.10] text-emerald-400 text-[10px] font-bold">
              <ShieldCheck className="w-2.5 h-2.5" /> Verified Live
            </span>
          </div>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); startDirections({ coords: venue.coordinates, name: venue.name }); }}
        aria-label={`Directions to ${venue.name}`}
        className="self-center flex-shrink-0 w-11 h-11 rounded-2xl bg-[var(--k-color-coral)]/10 flex items-center justify-center
                   active:scale-90 transition-transform hover:bg-[var(--k-color-coral)]/20"
      >
        <Navigation className="w-4 h-4 text-[var(--k-color-coral)]" />
      </button>
    </div>
  );
}
