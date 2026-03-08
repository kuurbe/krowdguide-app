import { useMemo } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { CrowdPill } from '../shared/CrowdPill';
import { Navigation, Clock, Beer, X } from 'lucide-react';
import { openDirections } from '../../utils/directions';
import type { Venue } from '../../types';

/** Google-style "Popular Times" bar chart */
const HOURS = ['12p', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11p'];

function PopularTimesBar({ pct, crowd }: { pct: number; crowd: string }) {
  const bars = useMemo(() => {
    const base = pct / 100;
    // Synthetic hourly pattern: ramps up through afternoon, peaks around 8-9 PM
    const pattern = [0.15, 0.12, 0.18, 0.25, 0.35, 0.5, 0.65, 0.8, 0.95, 1.0, 0.85, 0.55];
    return pattern.map(p => Math.min(Math.round(p * base * 100), 100));
  }, [pct]);

  // Current hour marker (simulate ~8 PM as "now")
  const nowIndex = 8;

  const barColor = (value: number) => {
    if (value >= 70) return '#ff4d6a';
    if (value >= 40) return '#fbbf24';
    return '#34d399';
  };

  return (
    <div>
      <div className="flex items-end gap-[3px] h-[56px]">
        {bars.map((value, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <div
              className="w-full rounded-[3px] min-h-[3px] transition-all"
              style={{
                height: `${Math.max(value * 0.56, 3)}px`,
                backgroundColor: i === nowIndex ? barColor(value) : barColor(value),
                opacity: i === nowIndex ? 1 : 0.5,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-[3px] mt-1.5">
        {HOURS.map((h, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[8px] leading-none
                       ${i === nowIndex ? 'text-[var(--k-text)] font-bold' : 'text-[var(--k-text-f)]'}
                       ${i % 2 !== 0 ? 'invisible' : ''}`}
          >
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}

export function VenueDetailSheet({
  venue,
  onClose,
}: {
  venue: Venue | null;
  onClose: () => void;
}) {
  if (!venue) return null;

  const crowdColor = venue.crowd === 'busy' ? '#ff4d6a' : venue.crowd === 'moderate' ? '#fbbf24' : '#34d399';

  return (
    <Drawer open={!!venue} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-w-md mx-auto bg-[var(--k-bg)] border-[var(--k-border)] rounded-t-[20px] overflow-hidden">
        <DrawerTitle className="sr-only">{venue.name}</DrawerTitle>
        {/* Hero image */}
        {venue.image && (
          <div className="venue-sheet-hero">
            <img src={venue.image} alt={venue.name} />
            {/* LOAD badge */}
            <div className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-extrabold
                            ${venue.crowd === 'busy' ? 'bg-[#ff4d6a]/90 text-white' :
                              venue.crowd === 'moderate' ? 'bg-amber-500/90 text-white' :
                              'bg-emerald-500/90 text-white'}`}>
              {venue.pct}% LOAD
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md
                     flex items-center justify-center active:scale-90 transition-transform"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="px-4 pb-6 -mt-4 relative z-10">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-syne text-[20px] font-extrabold text-[var(--k-text)] tracking-tight leading-tight">
                {venue.icon} {venue.name}
              </h2>
              <p className="text-[13px] text-[var(--k-text-m)] mt-0.5">{venue.type} · {venue.dist}</p>
            </div>
            <CrowdPill crowd={venue.crowd} pct={venue.pct} />
          </div>

          {/* Crowd progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-[var(--k-text-m)] uppercase tracking-[0.06em]">
                Crowd Level
              </span>
              <span className="text-[11px] font-bold" style={{ color: crowdColor }}>
                {venue.crowd === 'busy' ? 'Busy' : venue.crowd === 'moderate' ? 'Moderate' : 'Quiet'}
              </span>
            </div>
            <div className="crowd-bar">
              <div
                className="crowd-bar-fill"
                style={{ width: `${venue.pct}%`, backgroundColor: crowdColor }}
              />
            </div>
          </div>

          {/* Info chips */}
          {(venue.wait || venue.hasHH) && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {venue.wait && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-[12px] font-bold">
                  <Clock className="w-3.5 h-3.5" /> ~{venue.wait} wait
                </span>
              )}
              {venue.hasHH && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff8c42]/10 text-[#ff8c42] text-[12px] font-bold">
                  <Beer className="w-3.5 h-3.5" /> {venue.hhDeal}
                </span>
              )}
            </div>
          )}

          {/* Popular Times — Google-style bar chart */}
          <div className="mb-4">
            <p className="text-[11px] font-bold text-[var(--k-text-m)] uppercase tracking-[0.06em] mb-1.5">
              Popular Times
            </p>
            <div className="rounded-xl bg-[var(--k-surface)] border border-[var(--k-border)] p-3">
              <PopularTimesBar pct={venue.pct} crowd={venue.crowd} />
            </div>
          </div>

          {/* Directions button */}
          <button
            onClick={() => openDirections(venue.coordinates[0], venue.coordinates[1], venue.name)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ff4d6a] to-[#a855f7] text-white
                       font-bold text-[15px] flex items-center justify-center gap-2
                       active:scale-[0.98] transition-transform
                       shadow-[0_4px_20px_rgba(255,77,106,0.3)]"
          >
            <Navigation className="w-4.5 h-4.5" /> Get Directions
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
