import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { X, Share2, Footprints, Phone, Globe, Route, Star, MapPin, Clock, Heart } from 'lucide-react';
import { useAppContext } from '../../context';
import { enrichPOI, type EnrichedPOI } from '../../services/poiEnrichmentService';
import { fetchDirections, formatDuration, formatDistance } from '../../services/directionsService';
import { getUserLocation } from '../../utils/userLocation';

/** Format a POI group string for display: "food_and_drink" -> "Food & Drink" */
function formatGroup(group: string): string {
  return group
    .split('_')
    .map((w) => (w === 'and' ? '&' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

/** Skeleton shimmer block */
function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/10 ${className ?? ''}`} />
  );
}

export function POIDetailSheet() {
  const { selectedPOI, closePOISheet, startDirections, selectedCity } = useAppContext();

  const [enrichment, setEnrichment] = useState<EnrichedPOI | null>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [walkTime, setWalkTime] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [walkLoading, setWalkLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Reset state when POI changes
  useEffect(() => {
    setEnrichment(null);
    setEnrichLoading(false);
    setWalkTime(null);
    setDistance(null);
    setWalkLoading(false);
    setSaved(false);

    if (!selectedPOI) return;

    let cancelled = false;

    // Fetch enrichment from multiple free sources (OSM + Mapbox + optional Foursquare)
    (async () => {
      setEnrichLoading(true);
      try {
        const [lng, lat] = selectedPOI.coordinates;
        const result = await enrichPOI(selectedPOI.name, lng, lat);
        if (!cancelled) setEnrichment(result);
      } catch {
        /* graceful — enrichment is optional */
      } finally {
        if (!cancelled) setEnrichLoading(false);
      }
    })();

    // Fetch walking directions
    (async () => {
      setWalkLoading(true);
      try {
        const cityCenter: [number, number] = [
          selectedCity.coordinates[1],
          selectedCity.coordinates[0],
        ];
        const userLoc = await getUserLocation(cityCenter);
        const route = await fetchDirections(userLoc, selectedPOI.coordinates, 'walking');
        if (!cancelled) {
          setWalkTime(formatDuration(route.duration));
          setDistance(formatDistance(route.distance));
        }
      } catch {
        /* graceful — walk time is optional */
      } finally {
        if (!cancelled) setWalkLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedPOI, selectedCity]);

  if (!selectedPOI) return null;

  const poi = selectedPOI;

  const handleShare = async () => {
    const shareData = {
      title: poi.name,
      text: `${poi.name} - ${formatGroup(poi.group)}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(`${poi.name} - ${formatGroup(poi.group)}`);
    } catch {
      /* user cancelled */
    }
  };

  const handleDirections = () => {
    // POI coordinates are [lng, lat]; startDirections expects { coords: [lat, lng] }
    startDirections(
      { coords: [poi.coordinates[1], poi.coordinates[0]], name: poi.name },
      'walking',
    );
    closePOISheet();
  };

  const phone = enrichment?.phone;
  const website = enrichment?.website;

  return (
    <Drawer open={!!selectedPOI} onOpenChange={(open) => { if (!open) closePOISheet(); }}>
      <DrawerContent className="liquid-glass glass-border-glow glass-inner-light rounded-t-[20px] max-h-[85vh] max-w-[100vw] mx-auto flex flex-col">
        <DrawerTitle className="sr-only">{poi.name}</DrawerTitle>

        <div className="overflow-y-auto no-scrollbar flex-1 px-5 pb-8 pt-2">
          {/* ── Header row: Share | Name + Category | Close ── */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full glass-chip flex items-center justify-center flex-shrink-0 ios-press"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4 text-[var(--k-text-m)]" />
            </button>

            <div className="flex-1 text-center min-w-0">
              <h2 className="font-syne text-[20px] font-extrabold text-[var(--k-text)] tracking-[-0.025em] leading-tight">
                {poi.name}
              </h2>
              <p className="text-[13px] text-[var(--k-text-m)] mt-0.5">
                {enrichment?.category
                  ? enrichment.category.charAt(0).toUpperCase() + enrichment.category.slice(1)
                  : poi.group && poi.group !== 'poi'
                    ? formatGroup(poi.group)
                    : enrichLoading
                      ? 'Loading...'
                      : 'Place'}
              </p>
              {enrichment?.address && (
                <p className="text-[11px] text-[var(--k-text-f)] mt-0.5 truncate max-w-[220px] mx-auto">
                  {enrichment.address}
                </p>
              )}
            </div>

            <button
              onClick={closePOISheet}
              className="w-8 h-8 rounded-full glass-chip flex items-center justify-center flex-shrink-0 ios-press"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-[var(--k-text-m)]" />
            </button>
          </div>

          {/* ── Action buttons row ── */}
          <div className="flex gap-2.5 mb-4">
            {/* Walking time — highlighted coral gradient */}
            <button
              onClick={handleDirections}
              className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl text-white ios-press"
              style={{
                background: 'linear-gradient(135deg, #ff4d6a, #ff8c42)',
                boxShadow: '0 4px 20px rgba(255,77,106,0.3)',
              }}
            >
              <Footprints className="w-5 h-5" />
              {walkLoading ? (
                <Shimmer className="w-10 h-3" />
              ) : (
                <span className="text-[11px] font-bold">{walkTime ?? '--'}</span>
              )}
            </button>

            {/* Call */}
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl glass-chip ios-press"
              >
                <Phone className="w-5 h-5 text-[var(--k-text-2)]" />
                <span className="text-[11px] font-bold text-[var(--k-text-2)]">Call</span>
              </a>
            ) : (
              <div className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl glass-chip opacity-40">
                <Phone className="w-5 h-5 text-[var(--k-text-m)]" />
                <span className="text-[11px] font-bold text-[var(--k-text-m)]">Call</span>
              </div>
            )}

            {/* Website */}
            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl glass-chip ios-press"
              >
                <Globe className="w-5 h-5 text-[var(--k-text-2)]" />
                <span className="text-[11px] font-bold text-[var(--k-text-2)]">Website</span>
              </a>
            ) : (
              <div className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl glass-chip opacity-40">
                <Globe className="w-5 h-5 text-[var(--k-text-m)]" />
                <span className="text-[11px] font-bold text-[var(--k-text-m)]">Website</span>
              </div>
            )}

            {/* Directions */}
            <button
              onClick={handleDirections}
              className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl glass-chip ios-press"
            >
              <Route className="w-5 h-5 text-[var(--k-text-2)]" />
              <span className="text-[11px] font-bold text-[var(--k-text-2)]">Directions</span>
            </button>
          </div>

          {/* ── Info strip ── */}
          <div className="flex items-center px-4 py-3 rounded-[18px] glass-chip mb-4">
            {/* Hours */}
            <div className="flex-1 flex items-center justify-center gap-1.5">
              {enrichLoading ? (
                <Shimmer className="w-14 h-3" />
              ) : enrichment?.hours ? (
                <>
                  <div
                    className={`w-[6px] h-[6px] rounded-full ${
                      enrichment.hours.isOpen ? 'bg-emerald-400' : 'bg-red-400'
                    }`}
                  />
                  <span
                    className={`text-[12px] font-bold ${
                      enrichment.hours.isOpen ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {enrichment.hours.isOpen ? 'Open' : 'Closed'}
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-[var(--k-text-m)]" />
                  <span className="text-[12px] font-bold text-[var(--k-text-m)]">--</span>
                </>
              )}
            </div>

            <div
              className="w-px h-5 flex-shrink-0"
              style={{
                background:
                  'linear-gradient(to bottom, transparent, var(--k-border), transparent)',
              }}
            />

            {/* Rating */}
            <div className="flex-1 flex items-center justify-center gap-1.5">
              {enrichLoading ? (
                <Shimmer className="w-12 h-3" />
              ) : enrichment?.rating ? (
                <>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[12px] font-bold text-[var(--k-text)]">
                    {enrichment.rating.toFixed(1)}
                  </span>
                </>
              ) : (
                <>
                  <Star className="w-3 h-3 text-[var(--k-text-m)]" />
                  <span className="text-[12px] font-bold text-[var(--k-text-m)]">--</span>
                </>
              )}
            </div>

            <div
              className="w-px h-5 flex-shrink-0"
              style={{
                background:
                  'linear-gradient(to bottom, transparent, var(--k-border), transparent)',
              }}
            />

            {/* Distance */}
            <div className="flex-1 flex items-center justify-center gap-1.5">
              {walkLoading ? (
                <Shimmer className="w-10 h-3" />
              ) : distance ? (
                <>
                  <MapPin className="w-3 h-3 text-[var(--k-text-m)]" />
                  <span className="text-[12px] font-bold text-[var(--k-text)]">{distance}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3 text-[var(--k-text-m)]" />
                  <span className="text-[12px] font-bold text-[var(--k-text-m)]">--</span>
                </>
              )}
            </div>
          </div>

          {/* ── Photo carousel ── */}
          {enrichment?.photos && enrichment.photos.length > 0 && (
            <div className="mb-4">
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
                {enrichment.photos.map((url, i) => (
                  <div key={url} className="relative flex-shrink-0">
                    <img
                      src={url}
                      alt={`${poi.name} photo ${i + 1}`}
                      className="w-[140px] h-[100px] rounded-xl object-cover flex-shrink-0"
                      loading="lazy"
                    />
                    {i === 0 && (
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
                        <span className="text-[9px] font-bold text-white/80">From Business</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Bottom action row: Save + Share ── */}
          <div className="flex items-center justify-center gap-6 mt-2 mb-2">
            <button
              onClick={() => setSaved((s) => !s)}
              className="flex flex-col items-center gap-1.5 ios-press"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  saved ? 'bg-[#ff4d6a]/15' : 'glass-chip'
                }`}
              >
                <Heart
                  className={`w-[18px] h-[18px] ${
                    saved ? 'text-[#ff4d6a] fill-[#ff4d6a]' : 'text-[var(--k-text-m)]'
                  }`}
                />
              </div>
              <span className="text-[10px] font-semibold text-[var(--k-text-m)]">
                {saved ? 'Saved' : 'Save'}
              </span>
            </button>

            <button onClick={handleShare} className="flex flex-col items-center gap-1.5 ios-press">
              <div className="w-10 h-10 rounded-full glass-chip flex items-center justify-center">
                <Share2 className="w-[18px] h-[18px] text-[var(--k-text-m)]" />
              </div>
              <span className="text-[10px] font-semibold text-[var(--k-text-m)]">Share</span>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
