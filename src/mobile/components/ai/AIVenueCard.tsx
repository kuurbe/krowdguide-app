import { Heart, Navigation } from 'lucide-react';
import { CrowdPill } from '../shared/CrowdPill';
import { useAppContext } from '../../context';
import type { Venue } from '../../types';

interface AIVenueCardProps {
  venue: Venue;
  index?: number;
  showHHDeal?: boolean;
}

export function AIVenueCard({ venue, index = 0, showHHDeal = false }: AIVenueCardProps) {
  const { selectVenue, startDirections, isFavorite, toggleFavorite } = useAppContext();
  const fav = isFavorite(venue.id);

  return (
    <div
      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[var(--k-surface-solid)] border border-[var(--k-border)]
                 shadow-[var(--k-card-shadow)] cursor-pointer ios-press transition-all animate-fadeUp"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => selectVenue(venue)}
    >
      {/* Thumbnail */}
      {venue.image ? (
        <img
          src={venue.image}
          alt={venue.name}
          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-[var(--k-surface)] flex items-center justify-center text-lg flex-shrink-0">
          {venue.icon}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-[var(--k-text)] truncate leading-tight tracking-[-0.01em]">
          {venue.icon} {venue.name}
        </p>
        <p className="text-[10px] text-[var(--k-text-m)] truncate mt-0.5">
          {venue.type} · {venue.dist}
        </p>
        {showHHDeal && venue.hasHH && venue.hhDeal && (
          <p className="text-[10px] text-[#ff8c42] font-semibold truncate mt-0.5">
            {venue.hhDeal}
          </p>
        )}
      </div>

      {/* Crowd pill */}
      <CrowdPill crowd={venue.crowd} pct={venue.pct} />

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(venue.id); }}
          className="w-7 h-7 rounded-lg bg-[var(--k-surface)] flex items-center justify-center
                     active:scale-90 transition-all"
          aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${fav ? 'text-[#ff4d6a] fill-[#ff4d6a]' : 'text-[var(--k-text-f)]'}`}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            startDirections({ coords: venue.coordinates, name: venue.name });
          }}
          className="w-7 h-7 rounded-lg bg-[#ff4d6a]/10 flex items-center justify-center
                     active:scale-90 transition-all"
          aria-label={`Directions to ${venue.name}`}
        >
          <Navigation className="w-3.5 h-3.5 text-[#ff4d6a]" />
        </button>
      </div>
    </div>
  );
}
