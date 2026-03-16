import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { CrowdPill } from '../shared/CrowdPill';
import { CrowdMomentum } from '../shared/CrowdMomentum';
import { CrowdPredictionChart } from '../charts/CrowdPredictionChart';
import { Clock, Beer, X, Users, Star, Car, Footprints, Bike, Sparkles, MapPin, Heart } from 'lucide-react';
import { useAppContext } from '../../context';
import type { Venue } from '../../types';
import type { TravelMode } from '../../services/directionsService';

/** Star rating component */
function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = rating >= i ? 1 : rating >= i - 0.5 ? 0.5 : 0;
    stars.push(
      <div key={i} className="relative w-[14px] h-[14px]">
        <Star className="absolute inset-0 w-[14px] h-[14px] text-[var(--k-fill)] stroke-[1.5] fill-[var(--k-fill)]" />
        {fill > 0 && (
          <div className="absolute inset-0 overflow-hidden" style={{ width: fill === 1 ? '100%' : '50%' }}>
            <Star className="w-[14px] h-[14px] text-amber-400 stroke-[1.5] fill-amber-400" />
          </div>
        )}
      </div>
    );
  }
  return <div className="flex items-center gap-[2px]">{stars}</div>;
}

const DIR_MODES: { id: TravelMode; label: string; Icon: typeof Car }[] = [
  { id: 'driving', label: 'Drive', Icon: Car },
  { id: 'walking', label: 'Walk', Icon: Footprints },
  { id: 'cycling', label: 'Bike', Icon: Bike },
];

export function VenueDetailSheet({
  venue,
  onClose,
}: {
  venue: Venue | null;
  onClose: () => void;
}) {
  const { startDirections, isFavorite, toggleFavorite } = useAppContext();

  if (!venue) return null;

  const fav = isFavorite(venue.id);

  const crowdColor = venue.crowd === 'busy' ? '#ff4d6a' : venue.crowd === 'moderate' ? '#fbbf24' : '#34d399';
  const crowdLabel = venue.crowd === 'busy' ? 'Busy' : venue.crowd === 'moderate' ? 'Moderate' : 'Quiet';

  return (
    <Drawer open={!!venue} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="liquid-glass glass-border-glow glass-inner-light rounded-t-[20px] overflow-hidden">
        <DrawerTitle className="sr-only">{venue.name}</DrawerTitle>

        {/* Hero image — taller with mesh gradient overlay */}
        {venue.image ? (
          <div className="venue-sheet-hero relative" style={{ height: 240 }}>
            <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
            {/* Mesh gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--k-bg)] via-transparent to-transparent" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.25), transparent)' }} />

            {/* LOAD badge — top right */}
            <div className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-extrabold backdrop-blur-sm
                            ${venue.crowd === 'busy' ? 'bg-[#ff4d6a]/80 text-white' :
                              venue.crowd === 'moderate' ? 'bg-amber-500/80 text-white' :
                              'bg-emerald-500/80 text-white'}`}>
              {venue.pct}%
            </div>

            {/* Momentum badge — bottom left */}
            <div className="absolute bottom-6 left-5 z-10 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
              <CrowdMomentum venue={venue} />
            </div>
          </div>
        ) : (
          /* Skeleton placeholder when no image */
          <div className="relative bg-[var(--k-surface)]" style={{ height: 180 }}>
            <div className="w-full h-full flex items-center justify-center text-4xl">{venue.icon}</div>
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--k-bg)] via-transparent to-transparent" />
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

        {/* Favorite heart */}
        <button
          onClick={() => toggleFavorite(venue.id)}
          className="absolute top-3 right-14 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md
                     flex items-center justify-center active:scale-90 transition-all"
          aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${fav ? 'text-[#ff4d6a] fill-[#ff4d6a]' : 'text-white/70'}`}
          />
        </button>

        <div className="px-5 pb-8 -mt-6 relative z-10">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="min-w-0 flex-1">
              <h2 className="font-syne text-[22px] font-extrabold text-[var(--k-text)] tracking-[-0.025em] leading-tight">
                {venue.icon} {venue.name}
              </h2>
              <p className="text-[13px] text-[var(--k-text-m)] mt-1">{venue.type} · {venue.dist}</p>
            </div>
            <CrowdPill crowd={venue.crowd} pct={venue.pct} />
          </div>

          {/* Star ratings */}
          {venue.rating && (
            <div className="flex items-center gap-2 mb-3">
              <StarRating rating={venue.rating} />
              <span className="text-[13px] font-bold text-[var(--k-text)]">{venue.rating}</span>
            </div>
          )}

          {/* Info strip — upgraded glass-chip bar */}
          <div className="flex items-center px-4 py-3 rounded-[18px] glass-chip mb-4">
            {/* Crowd */}
            <div className="flex-1 flex items-center justify-center gap-1.5">
              <Users className="w-3 h-3" style={{ color: crowdColor }} />
              <span className="text-[13px] font-extrabold" style={{ color: crowdColor }}>{crowdLabel}</span>
            </div>
            <div className="w-px h-5 flex-shrink-0" style={{ background: 'linear-gradient(to bottom, transparent, var(--k-border), transparent)' }} />
            {/* Wait / Happy Hour */}
            <div className="flex-1 flex items-center justify-center gap-1.5">
              {venue.hasHH ? (
                <>
                  <Beer className="w-3 h-3 text-[#ff8c42]" />
                  <span className="text-[12px] font-bold text-[#ff8c42] truncate max-w-[80px]">{venue.hhDeal}</span>
                </>
              ) : venue.wait ? (
                <>
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-[12px] font-bold text-amber-400">~{venue.wait}</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span className="text-[12px] font-bold text-emerald-400">No wait</span>
                </>
              )}
            </div>
            <div className="w-px h-5 flex-shrink-0" style={{ background: 'linear-gradient(to bottom, transparent, var(--k-border), transparent)' }} />
            {/* Distance */}
            <div className="flex-1 flex items-center justify-center gap-1.5">
              <MapPin className="w-3 h-3 text-[var(--k-text-m)]" />
              <span className="text-[12px] font-bold text-[var(--k-text)]">{venue.dist}</span>
            </div>
          </div>

          {/* Crowd progress bar — wider with glow */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="type-overline text-[var(--k-text-m)]">
                Crowd Level
              </span>
              <span className="text-[11px] font-bold" style={{ color: crowdColor }}>
                {venue.pct}%
              </span>
            </div>
            <div className="crowd-bar" style={{ height: 5, borderRadius: 2.5 }}>
              <div
                className="crowd-bar-fill"
                style={{
                  width: `${venue.pct}%`,
                  backgroundColor: crowdColor,
                  borderRadius: 2.5,
                  boxShadow: `0 0 8px ${crowdColor}40`,
                }}
              />
            </div>
          </div>

          {/* Crowd Prediction — 24-hour bar chart */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--k-accent)]" />
              <p className="type-overline text-[var(--k-text-m)]">
                Crowd Prediction
              </p>
            </div>
            <CrowdPredictionChart venue={venue} />
          </div>

          {/* Directions mode selector — spring press + brand gradient */}
          <div className="flex gap-2.5">
            {DIR_MODES.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => {
                  startDirections({ coords: venue.coordinates, name: venue.name }, id);
                  onClose();
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-[18px]
                           text-[13px] font-bold transition-all
                           ${id === 'walking'
                             ? 'text-white'
                             : 'glass-chip text-[var(--k-text-2)]'
                           }`}
                style={{
                  ...(id === 'walking' ? {
                    background: 'linear-gradient(135deg, #ff4d6a, #ff8c42)',
                    boxShadow: '0 4px 20px rgba(255,77,106,0.3)',
                  } : {}),
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'; }}
                onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
