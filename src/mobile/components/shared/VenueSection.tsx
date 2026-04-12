import { useState } from 'react';
import type { Venue } from '../../types';
import { CrowdPill } from './CrowdPill';
import { CrowdMomentum } from './CrowdMomentum';
import { ChevronRight, Heart } from 'lucide-react';
import { useAppContext } from '../../context';

interface VenueSectionProps {
  icon: string;
  title: string;
  accentColor: string;
  venues: Venue[];
  onVenueTap: (venue: Venue) => void;
  venueRefs?: React.MutableRefObject<Map<string, HTMLElement>>;
}

export function VenueSection({ icon, title, accentColor, venues, onVenueTap, venueRefs }: VenueSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const { isFavorite, toggleFavorite } = useAppContext();
  const visible = showAll ? venues : venues.slice(0, 4);

  if (venues.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {/* Section header — accent line + label + see all */}
      <div className="flex items-center gap-2 pt-2 pb-0.5">
        <div className="w-[3px] h-[18px] rounded-full" style={{ backgroundColor: accentColor }} />
        <span className="text-[13px]">{icon}</span>
        <span className="text-[13px] font-extrabold text-[var(--k-text)] tracking-[-0.01em]">{title}</span>
        {venues.length > 4 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            data-vaul-no-drag
            onPointerDown={(e) => e.stopPropagation()}
            className="ml-auto flex items-center gap-0.5 text-[11px] font-bold transition-colors"
            style={{ color: accentColor }}
          >
            See all <ChevronRight className="w-3 h-3" />
          </button>
        )}
        {(venues.length <= 4 || showAll) && (
          <span
            className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
          >
            {venues.length}
          </span>
        )}
      </div>

      {/* 2-column image-forward grid — wider gap, taller cards */}
      <div className="grid grid-cols-2 gap-3">
        {visible.map((venue, i) => {
          const fav = isFavorite(venue.id);
          const crowdColor = venue.crowd === 'busy' ? 'var(--k-color-coral)' : venue.crowd === 'moderate' ? 'var(--k-color-amber)' : 'var(--k-color-green)';
          return (
            <div
              key={venue.id}
              ref={(el) => { if (el && venueRefs?.current) venueRefs.current.set(venue.id, el); }}
              className="venue-grid-card rounded-2xl overflow-hidden glass-chip text-left
                         animate-fadeUp cursor-pointer relative"
              style={{
                animationDelay: `${i * 0.06}s`,
                borderLeft: `2px solid ${crowdColor}20`,
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
              onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              {/* Image — tappable to open detail */}
              <div
                className="relative aspect-[3/2.5] bg-[var(--k-surface)] overflow-hidden"
                onClick={() => onVenueTap(venue)}
              >
                {venue.image ? (
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {venue.icon}
                  </div>
                )}

                {/* Bottom gradient — taller for better contrast */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />

                {/* Crowd % badge — top right */}
                <div
                  className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold
                             backdrop-blur-sm text-white
                             ${venue.crowd === 'busy' ? 'bg-[var(--k-color-coral)]/80' :
                               venue.crowd === 'moderate' ? 'bg-amber-500/80' :
                               'bg-emerald-500/80'}`}
                >
                  {venue.pct}%
                </div>

                {/* Heart — top left */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(venue.id); }}
                  data-vaul-no-drag
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm
                             flex items-center justify-center active:scale-90 transition-all z-10"
                  aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-colors ${fav ? 'text-[var(--k-color-coral)] fill-[var(--k-color-coral)]' : 'text-white/70'}`}
                  />
                </button>

                {/* Momentum badge — bottom left */}
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-full
                               bg-black/50 backdrop-blur-sm">
                  <CrowdMomentum venue={venue} />
                </div>
              </div>

              {/* Card info — tappable, more padding */}
              <div className="p-3" onClick={() => onVenueTap(venue)}>
                <h4 className="type-title-3 truncate text-[var(--k-text)] leading-tight">
                  {venue.icon} {venue.name}
                </h4>
                <p className="text-[10px] text-[var(--k-text-m)] mt-0.5 truncate">
                  {venue.type} · {venue.dist}
                </p>
                <div className="mt-1.5">
                  <CrowdPill crowd={venue.crowd} pct={venue.pct} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show all toggle */}
      {venues.length > 4 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          data-vaul-no-drag
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full venue-grid-show-more"
        >
          Show all {venues.length} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
