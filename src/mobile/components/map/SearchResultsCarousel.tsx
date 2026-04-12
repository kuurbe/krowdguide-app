import { useRef, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { CrowdPill } from '../shared/CrowdPill';
import type { Venue } from '../../types';
import { VenueIcon } from '../../utils/icons';

interface SearchResultsCarouselProps {
  venues: Venue[];
  onSelect: (venue: Venue) => void;
  onClear: () => void;
}

export function SearchResultsCarousel({ venues, onSelect, onClear }: SearchResultsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll on new results
  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0 });
  }, [venues]);

  if (venues.length === 0) return null;

  return (
    <div className="absolute bottom-[88px] left-0 right-0 z-[1050] animate-fadeUp">
      {/* Clear button */}
      <div className="flex justify-end px-4 mb-2">
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full glass-chip text-[10px] font-bold
                     text-[var(--k-text-m)] ios-press"
        >
          <X className="w-3 h-3" /> Clear
        </button>
      </div>

      {/* Scrollable card strip */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-pl-4 px-4 pb-1"
      >
        {venues.map((venue) => (
          <button
            key={venue.id}
            onClick={() => onSelect(venue)}
            className="flex-shrink-0 w-[272px] snap-start flex items-stretch gap-3
                       p-3 rounded-2xl liquid-glass ios-press
                       border-l-2 border-transparent hover:border-[var(--k-accent)]
                       transition-all active:scale-[0.98]"
          >
            {/* Thumbnail */}
            {venue.image ? (
              <img
                src={venue.image}
                alt={venue.name}
                className="w-[76px] h-[76px] rounded-xl object-cover flex-shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="w-[76px] h-[76px] rounded-xl bg-[var(--k-surface)] flex items-center justify-center flex-shrink-0">
                <VenueIcon iconId={venue.icon} className="w-7 h-7 text-[var(--k-text-f)]" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between text-left py-0.5">
              <div>
                <h4 className="text-[13px] font-bold text-[var(--k-text)] truncate leading-tight tracking-[-0.01em]">
                  {venue.name}
                </h4>
                <p className="text-[11px] text-[var(--k-text-m)] mt-0.5 truncate">
                  {venue.type} · {venue.dist}
                </p>
              </div>

              <div className="flex items-center justify-between mt-1.5">
                {/* Rating */}
                {venue.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-[11px] font-bold text-[var(--k-text)]">{venue.rating}</span>
                  </div>
                )}

                {/* Crowd pill */}
                <CrowdPill crowd={venue.crowd} pct={venue.pct} />
              </div>
            </div>
          </button>
        ))}

        {/* Trailing spacer for snap */}
        <div className="flex-shrink-0 w-4" />
      </div>
    </div>
  );
}
