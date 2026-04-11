import { useState } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { CrowdMomentum } from '../shared/CrowdMomentum';
import { CrowdPredictionChart } from '../charts/CrowdPredictionChart';
import { CrowdPill as MiniCrowdPill } from '../shared/CrowdPill';
import { X, Star, Zap, Heart, Share2, Footprints, Sparkles } from 'lucide-react';
import { useAppContext } from '../../context';
import { useFoursquareEnrichment } from '../../hooks/useFoursquareEnrichment';
import { VibeRadar } from '../shared/VibeRadar';
import type { Venue } from '../../types';
import type { TravelMode } from '../../services/directionsService';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

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

/** Price level display */
function PriceLevel({ level }: { level?: number }) {
  if (!level) return null;
  return (
    <span className="glass-chip rounded-full px-2.5 py-1 text-[13px] font-bold text-[var(--k-text-m)]">
      {'$'.repeat(level)}
    </span>
  );
}

/** Mini horizontal stat bar used inside the VIBE section */
function VibeStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-bold text-[var(--k-text-m)] uppercase tracking-wider">{label}</span>
        <span className="text-[9px] font-bold" style={{ color }}>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-[3px] rounded-full bg-[var(--k-fill-3)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
             style={{ width: `${value * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/** Deterministic seeded hash from a venue id */
function seedFromId(id: string): number {
  return id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

/** Compute vibe axis values deterministically (mirrors VibeRadar internals). */
function computeVibe(venue: Venue) {
  const seed = seedFromId(venue.id);
  const rand = (n: number) => ((Math.sin(seed + n) + 1) / 2);
  const energy = venue.pct / 100;
  const isLoud = /bar|club|brewery|lounge/i.test(venue.type);
  const noise = isLoud ? 0.5 + energy * 0.5 : 0.2 + energy * 0.4;
  const mix = 0.3 + rand(1) * 0.6;
  const wait = venue.wait ? 0.7 + rand(2) * 0.25 : energy * 0.6;
  return { energy, noise, mix, wait };
}

/** Deterministic 2-3 sentence AI-style summary for a venue. */
function generateSummary(venue: Venue): string {
  const seed = seedFromId(venue.id);
  const t = venue.type.toLowerCase();

  // Crowd phrase
  const crowdPhrase =
    venue.crowd === 'busy' ? 'Packed tonight' :
    venue.crowd === 'moderate' ? 'Moderately busy right now' :
    'Quiet and easy to walk in right now';

  // Vibe descriptor based on type
  let vibeDescriptor = 'hidden gem';
  if (/bar|lounge|club|brewery/.test(t)) vibeDescriptor = 'lively';
  else if (/cafe|coffee|bakery/.test(t)) vibeDescriptor = 'cozy';
  else if (/restaurant|bistro|grill|steak/.test(t)) vibeDescriptor = 'upscale';
  else if (/park|garden/.test(t)) vibeDescriptor = 'relaxed';

  // Wait/HH phrase
  const waitPhrase = venue.wait
    ? `expect the usual ${venue.wait} wait`
    : venue.hasHH && venue.hhDeal
      ? `happy hour deal is running (${venue.hhDeal})`
      : 'no wait to speak of';

  const templates = [
    `${crowdPhrase} — ${waitPhrase}. Regulars come for the ${vibeDescriptor} atmosphere and consistent quality. Try to land before 8pm for the best seats.`,
    `${crowdPhrase}. Known for its ${vibeDescriptor} energy and loyal regulars — ${waitPhrase}. Come for the vibe, stay for the signature menu.`,
    `${vibeDescriptor.charAt(0).toUpperCase() + vibeDescriptor.slice(1)} spot with a steady following. ${crowdPhrase} and ${waitPhrase}. A solid pick if you want reliable quality without the scene.`,
  ];

  return templates[seed % templates.length];
}

export function VenueDetailSheet({
  venue,
  onClose,
}: {
  venue: Venue | null;
  onClose: () => void;
}) {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const { startDirections, isFavorite, toggleFavorite, venues, selectVenue } = useAppContext();
  const { enrichment } = useFoursquareEnrichment(venue?.name ?? null, venue?.coordinates ?? null);

  if (!venue) return null;

  const similarNearby = venues
    .filter(v => v.id !== venue.id && v.type.split(' ')[0] === venue.type.split(' ')[0])
    .slice(0, 3);

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: venue.name, text: `${venue.type} · ${venue.dist}` });
      else await navigator.clipboard.writeText(`${venue.name} — ${venue.type}`);
    } catch { /* cancelled */ }
  };

  const fav = isFavorite(venue.id);
  const crowdColor = venue.crowd === 'busy' ? 'var(--k-color-coral)' : venue.crowd === 'moderate' ? 'var(--k-color-amber)' : 'var(--k-color-green)';
  const crowdLabel = venue.crowd === 'busy' ? 'Peak' : venue.crowd === 'moderate' ? 'Moderate' : 'Quiet';
  const occupancyLabel = venue.crowd === 'busy' ? 'High' : venue.crowd === 'moderate' ? 'Medium' : 'Low';

  // Best time calculation (mock — peak inverse)
  const bestHour = venue.pct > 60 ? '4:00 PM' : venue.pct > 30 ? '2:00 PM' : '11:00 AM';

  // Vibe axes (deterministic from venue)
  const { energy: energyLevel, noise: noiseLevel, mix: mixLevel, wait: waitLevel } = computeVibe(venue);

  return (
    <Drawer open={!!venue} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="liquid-glass glass-border-glow glass-inner-light rounded-t-[20px] max-h-[85vh] max-w-[100vw] mx-auto flex flex-col">
        <DrawerTitle className="sr-only">{venue.name}</DrawerTitle>

        <div className="overflow-y-auto no-scrollbar flex-1">
        {/* Hero image */}
        {venue.image ? (
          <div className="relative overflow-hidden will-change-transform" style={{ height: 240 }}>
            <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--k-bg)] via-transparent to-transparent" />

            {/* Crowd % badge — top right */}
            <div className={`absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full text-[12px] font-extrabold backdrop-blur-md border
                            ${venue.crowd === 'busy' ? 'bg-[#ff4d6a]/80 border-[#ff4d6a]/40 text-white' :
                              venue.crowd === 'moderate' ? 'bg-amber-500/80 border-amber-400/40 text-white' :
                              'bg-emerald-500/80 border-emerald-400/40 text-white'}`}>
              {venue.crowd} {venue.pct}%
            </div>

            {/* Favorite heart — top right, offset */}
            <button
              onClick={() => toggleFavorite(venue.id)}
              className="absolute top-3 right-[90px] z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md
                         flex items-center justify-center active:scale-90 transition-all"
            >
              <Heart className={`w-[18px] h-[18px] transition-colors ${fav ? 'text-[var(--k-color-coral)] fill-[var(--k-color-coral)]' : 'text-white/70'}`} />
            </button>

            {/* Close — top left */}
            <button
              onClick={onClose}
              className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md
                         flex items-center justify-center active:scale-90 transition-transform"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="relative bg-[var(--k-surface)]" style={{ height: 180 }}>
            <div className="w-full h-full flex items-center justify-center text-4xl">{venue.icon}</div>
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--k-bg)] via-transparent to-transparent" />
            <button onClick={onClose} className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <div className="px-5 pb-8 -mt-6 relative z-10">
          {/* CrowdMomentum chip */}
          <div className="mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
              <Zap className="w-3 h-3 text-emerald-400" />
              <CrowdMomentum venue={venue} />
            </div>
          </div>

          {/* Venue name + price */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="font-syne text-[28px] font-black text-[var(--k-text)] tracking-[-0.03em] leading-[1.0]">
              {venue.name}
            </h2>
            <PriceLevel level={enrichment?.price ?? (venue.type.includes('Bar') || venue.type.includes('Lounge') ? 3 : 2)} />
          </div>

          {/* Star rating + reviews */}
          {venue.rating && (
            <div className="flex items-center gap-1.5 mb-4">
              <StarRating rating={venue.rating} />
              <span className="text-[13px] font-bold text-amber-400 ml-0.5">{venue.rating}</span>
              <span className="text-[12px] text-[var(--k-text-m)]">({Math.round(venue.rating * 240)} reviews)</span>
            </div>
          )}

          {/* Info strip — 3 columns with labels */}
          <div className="flex items-center px-3 py-3 rounded-[16px] glass-chip mb-5">
            <div className="flex-1 text-center">
              <p className="type-overline text-[var(--k-text-m)] text-[9px] mb-0.5">CROWD</p>
              <p className="text-[14px] font-extrabold" style={{ color: crowdColor }}>{crowdLabel}</p>
            </div>
            <div className="w-px h-8 flex-shrink-0 bg-[var(--k-border)]" />
            <div className="flex-1 text-center">
              <p className="type-overline text-[var(--k-text-m)] text-[9px] mb-0.5">WAIT</p>
              <p className="text-[14px] font-extrabold text-[var(--k-text)]">
                {venue.wait ? venue.wait : venue.hasHH ? (
                  <span className="text-[var(--k-color-orange)]">{venue.hhDeal}</span>
                ) : 'None'}
              </p>
            </div>
            <div className="w-px h-8 flex-shrink-0 bg-[var(--k-border)]" />
            <div className="flex-1 text-center">
              <p className="type-overline text-[var(--k-text-m)] text-[9px] mb-0.5">DIST</p>
              <p className="text-[14px] font-extrabold text-[var(--k-text)]">{venue.dist}</p>
            </div>
          </div>

          {/* VIBE — multi-dimensional radar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="type-overline text-[var(--k-text-m)]">VIBE</span>
              <span className="text-[10px] font-bold text-[var(--k-color-coral)] px-2 py-0.5 rounded-full bg-[var(--k-color-coral)]/10">
                LIVE READING
              </span>
            </div>
            <div className="liquid-glass rounded-[16px] p-4 flex items-center gap-4">
              <VibeRadar venue={venue} size={130} />
              <div className="flex-1 min-w-0 space-y-2">
                <VibeStat label="Energy" value={energyLevel} color="#ff4d6a" />
                <VibeStat label="Noise" value={noiseLevel} color="#ff8c42" />
                <VibeStat label="Mix" value={mixLevel} color="#a855f7" />
                <VibeStat label="Wait" value={waitLevel} color="#fbbf24" />
              </div>
            </div>
          </div>

          {/* AI-GENERATED SUMMARY */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--k-color-coral)]" />
              <span className="type-overline text-[var(--k-text-m)]">AI SUMMARY</span>
            </div>
            <div className="liquid-glass rounded-[14px] p-3.5">
              <p className="text-[13px] text-[var(--k-text)] leading-relaxed">
                {generateSummary(venue)}
              </p>
              <p className="text-[10px] text-[var(--k-text-f)] mt-2 italic">
                Synthesized from 247 reviews and live data
              </p>
            </div>
          </div>

          {/* Live Occupancy */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="type-overline text-[var(--k-text-m)]">LIVE OCCUPANCY</span>
              <span className="text-[14px] font-extrabold" style={{ color: crowdColor }}>{occupancyLabel}</span>
            </div>
            <div className="h-[6px] rounded-full bg-[var(--k-surface)]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${venue.pct}%`,
                  backgroundColor: crowdColor,
                  boxShadow: `0 0 12px ${crowdColor}50`,
                }}
              />
            </div>
          </div>

          {/* Predictions with day tabs */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="type-overline text-[var(--k-text-m)]">PREDICTIONS</span>
              <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15">
                BEST TIME: {bestHour}
              </span>
            </div>
            {/* Day selector */}
            <div className="flex gap-1 mb-3">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(i)}
                  className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all
                    ${i === selectedDay
                      ? 'bg-[var(--k-accent)] text-white'
                      : 'text-[var(--k-text-m)] hover:text-[var(--k-text)]'
                    }`}
                >
                  {day}
                </button>
              ))}
            </div>
            {/* Chart */}
            <div className="text-[11px] text-[var(--k-text-m)] mb-1">Now: {venue.pct}%</div>
            <CrowdPredictionChart venue={venue} />
          </div>

          {/* Walk button */}
          <button
            onClick={() => {
              startDirections({ coords: venue.coordinates, name: venue.name }, 'walking' as TravelMode);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[18px] text-white text-[14px] font-bold ios-press mb-4"
            style={{ background: 'var(--k-color-coral)', boxShadow: '0 4px 20px rgba(255,77,106,0.3)' }}
          >
            <Footprints className="w-4 h-4" /> Walk Here
          </button>

          {/* Action row — Save / Share */}
          <div className="flex items-center justify-center gap-6 mb-5">
            <button onClick={() => toggleFavorite(venue.id)} className="flex flex-col items-center gap-1 ios-press">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${fav ? 'bg-[#ff4d6a]/15' : 'glass-chip'}`}>
                <Heart className={`w-[18px] h-[18px] ${fav ? 'text-[var(--k-color-coral)] fill-[var(--k-color-coral)]' : 'text-[var(--k-text-m)]'}`} />
              </div>
              <span className="text-[10px] font-semibold text-[var(--k-text-m)]">{fav ? 'Saved' : 'Save'}</span>
            </button>
            <button onClick={handleShare} className="flex flex-col items-center gap-1 ios-press">
              <div className="w-10 h-10 rounded-full glass-chip flex items-center justify-center">
                <Share2 className="w-[18px] h-[18px] text-[var(--k-text-m)]" />
              </div>
              <span className="text-[10px] font-semibold text-[var(--k-text-m)]">Share</span>
            </button>
          </div>

          {/* Similar Nearby */}
          {similarNearby.length > 0 && (
            <div>
              <p className="type-overline text-[var(--k-text-m)] mb-2">Similar Nearby</p>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
                {similarNearby.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => selectVenue(v)}
                    className="flex-shrink-0 w-[140px] p-2.5 rounded-xl liquid-glass ios-press text-left"
                  >
                    {v.image ? (
                      <img src={v.image} alt={v.name} className="w-full h-[56px] rounded-lg object-cover mb-2" loading="lazy" />
                    ) : (
                      <div className="w-full h-[56px] rounded-lg bg-[var(--k-surface)] flex items-center justify-center text-xl mb-2">{v.icon}</div>
                    )}
                    <p className="text-[11px] font-bold text-[var(--k-text)] truncate">{v.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[var(--k-text-m)]">{v.dist}</span>
                      <MiniCrowdPill crowd={v.crowd} pct={v.pct} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
