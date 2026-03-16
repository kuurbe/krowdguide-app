import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '../../context';
import { getThingsForCity } from '../../data/venues';
import { useTicketmasterEvents } from '../../hooks/useTicketmasterEvents';
import { ExpandableVenueCard } from '../shared/ExpandableVenueCard';
import { EventCard } from '../shared/EventCard';
import { CrowdPill } from '../shared/CrowdPill';
import { SmartAlertBanner } from '../shared/SmartAlertBanner';
import { VenueSection } from '../shared/VenueSection';
import { ContextFilters } from '../shared/ContextFilters';
import { MAPBOX_TOKEN } from '../../config/mapbox';
import { generateCrowdPrediction, getCurrentHourIndex } from '../../utils/crowdPrediction';
import {
  Sparkles, Radio, Navigation, TrendingUp, Flame, Gem,
  UtensilsCrossed, Moon, Ticket, Video, MapPin, Users, Heart,
} from 'lucide-react';
import type { Venue } from '../../types';

/** Segment control — 2026 glass style with underline indicator feel */
const SEGMENT_CLASS = `flex-1 py-[8px] text-[13px] font-bold !rounded-[12px] whitespace-nowrap
                       text-[var(--k-text-f)] border-none
                       data-[state=active]:bg-[var(--k-surface-solid)] data-[state=active]:text-[var(--k-text)]
                       data-[state=active]:font-extrabold
                       data-[state=active]:shadow-[var(--k-shadow-sm)] transition-all tracking-[-0.01em]`;

/** Discovery vibe cards */
const VIBE_CARDS = [
  { id: 'gems', title: 'Hidden Gems', subtitle: 'Off the beaten path', gradient: 'from-[#22d3ee] to-[#0891b2]', Icon: Gem, tab: 'things' as const, typeFilter: 'all' as const },
  { id: 'food', title: 'Food & Drink', subtitle: 'Local favorites', gradient: 'from-[#ff4d6a] to-[#e63e58]', Icon: UtensilsCrossed, tab: 'restaurants' as const, typeFilter: 'food' as const },
  { id: 'nightlife', title: 'Nightlife', subtitle: 'After dark spots', gradient: 'from-[#a855f7] to-[#7c3aed]', Icon: Moon, tab: 'restaurants' as const, typeFilter: 'bars' as const },
  { id: 'events', title: 'Events Nearby', subtitle: "What's happening", gradient: 'from-[#fbbf24] to-[#f59e0b]', Icon: Ticket, tab: 'events' as const, typeFilter: 'all' as const },
] as const;

/** Snap point constants */
const SNAP_PEEK = 0.35;
const SNAP_HALF = 0.60;
const SNAP_FULL = 0.92;
const SNAP_POINTS = [SNAP_PEEK, SNAP_HALF, SNAP_FULL];

/** Section definitions for crowd-smart grouping */
const SECTIONS = [
  { id: 'sweet', icon: '🎯', title: 'Sweet Spots', accentColor: '#34d399', filter: (v: Venue) => v.pct >= 25 && v.pct <= 55 },
  { id: 'hh', icon: '🍺', title: 'Happy Hour Active', accentColor: '#ff8c42', filter: (v: Venue) => v.hasHH === true },
  { id: 'peak', icon: '🔥', title: 'Peak Energy', accentColor: '#ff4d6a', filter: (v: Venue) => v.pct > 70 },
  { id: 'radar', icon: '💎', title: 'Under the Radar', accentColor: '#a855f7', filter: (v: Venue) => v.pct < 25 },
] as const;

/** Type filter keywords */
const TYPE_KEYWORDS: Record<string, string[]> = {
  food: ['restaurant', 'grill', 'bistro', 'diner', 'kitchen', 'bbq', 'japanese', 'american'],
  bars: ['bar', 'brewery', 'brewpub', 'lounge', 'club', 'pub'],
  coffee: ['coffee', 'café', 'cafe', 'tea', 'bakery'],
  parks: ['park', 'garden', 'trail', 'outdoor'],
};

export function CityGuideDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    selectedCity, startDirections, setFlyoverActive, venues, pulse, isLive,
    flyToVenue, highlightedVenueId, setHighlightedVenueId, selectVenue, favorites,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('restaurants');
  const [snap, setSnap] = useState<number | string | null>(SNAP_HALF);
  const [crowdFilter, setCrowdFilter] = useState('any');
  const [typeFilter, setTypeFilter] = useState('all');
  const [smartSort, setSmartSort] = useState(false);
  const [showFavs, setShowFavs] = useState(false);

  const things = useMemo(() => getThingsForCity(selectedCity.id), [selectedCity.id]);
  const { events, loading } = useTicketmasterEvents(selectedCity.name);

  // Refs for scroll-to-venue (map→list sync)
  const venueRefs = useRef<Map<string, HTMLElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset snap to half when drawer opens
  useEffect(() => {
    if (open) setSnap(SNAP_HALF);
  }, [open]);

  // ── Filter venues ──
  const filteredVenues = useMemo(() => {
    let result = [...venues];

    // Crowd filter
    if (crowdFilter !== 'any') {
      const crowdMap: Record<string, string> = { quiet: 'quiet', moderate: 'moderate', busy: 'busy' };
      const mapped = crowdMap[crowdFilter];
      if (mapped) result = result.filter(v => v.crowd === mapped);
    }

    // Type filter
    if (typeFilter !== 'all') {
      const keywords = TYPE_KEYWORDS[typeFilter];
      if (keywords) {
        result = result.filter(v =>
          keywords.some(kw => v.type.toLowerCase().includes(kw))
        );
      }
    }

    // Smart sort — lowest predicted crowd in next 2 hours
    if (smartSort) {
      const hour = getCurrentHourIndex();
      result.sort((a, b) => {
        const predA = generateCrowdPrediction(a);
        const predB = generateCrowdPrediction(b);
        const avgA = (predA[hour]?.crowd ?? 50) + (predA[(hour + 1) % 24]?.crowd ?? 50);
        const avgB = (predB[hour]?.crowd ?? 50) + (predB[(hour + 1) % 24]?.crowd ?? 50);
        return avgA - avgB;
      });
    }

    return result;
  }, [venues, crowdFilter, typeFilter, smartSort]);

  // ── Crowd-smart sections ──
  const sections = useMemo(() =>
    SECTIONS.map(s => ({
      ...s,
      venues: filteredVenues.filter(s.filter),
    })).filter(s => s.venues.length > 0),
    [filteredVenues]
  );

  // ── Trending (top 4 by crowd pct) ──
  const trending = useMemo(
    () => [...filteredVenues].sort((a, b) => b.pct - a.pct).slice(0, 4),
    [filteredVenues]
  );

  // ── Stats ──
  const openCount = venues.length;
  const busyCount = venues.filter(v => v.crowd === 'busy').length;
  const moderateCount = venues.filter(v => v.crowd === 'moderate').length;
  const quietCount = venues.filter(v => v.crowd === 'quiet').length;
  const totalPeople = venues.reduce((s, v) => s + Math.round(v.pct * 0.8), 0);

  // Crowd pulse bar percentages
  const quietPct = openCount > 0 ? (quietCount / openCount) * 100 : 33;
  const moderatePct = openCount > 0 ? (moderateCount / openCount) * 100 : 33;
  const busyPct = openCount > 0 ? (busyCount / openCount) * 100 : 33;

  // Favorite venues
  const favoriteVenues = useMemo(() =>
    venues.filter(v => favorites.has(v.id)),
    [venues, favorites]
  );

  // Venue counts for filter pills
  const venueCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts.quiet = venues.filter(v => v.crowd === 'quiet').length;
    counts.moderate = venues.filter(v => v.crowd === 'moderate').length;
    counts.busy = venues.filter(v => v.crowd === 'busy').length;
    for (const [key, keywords] of Object.entries(TYPE_KEYWORDS)) {
      counts[key] = venues.filter(v => keywords.some(kw => v.type.toLowerCase().includes(kw))).length;
    }
    return counts;
  }, [venues]);

  // Busy venue name for stat pill
  const busiestVenue = useMemo(() =>
    venues.reduce<Venue | null>((best, v) => (!best || v.pct > best.pct) ? v : best, null),
    [venues]
  );

  // Aerial hero image from Mapbox Static API
  const heroUrl = useMemo(() => {
    const [lat, lng] = selectedCity.coordinates;
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},13,60/800x400@2x?access_token=${MAPBOX_TOKEN}`;
  }, [selectedCity]);

  // ── Map→List sync: scroll to highlighted venue ──
  useEffect(() => {
    if (!highlightedVenueId) return;
    const el = venueRefs.current.get(highlightedVenueId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('venue-highlight-ring');
      const t = setTimeout(() => el.classList.remove('venue-highlight-ring'), 3000);
      return () => clearTimeout(t);
    }
  }, [highlightedVenueId]);

  // ── Tap venue card → open detail sheet + close guide ──
  const handleVenueTap = useCallback((venue: Venue) => {
    selectVenue(venue);
    onOpenChange(false);
  }, [selectVenue, onOpenChange]);

  // ── Vibe card → set tab + filter ──
  const handleVibeTap = useCallback((tab: string, filter: string) => {
    setActiveTab(tab);
    if (filter !== 'all') setTypeFilter(filter);
  }, []);

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={SNAP_POINTS}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      fadeFromIndex={0}
    >
      <DrawerContent className="liquid-glass glass-border-glow glass-inner-light rounded-t-[20px] max-h-[92vh]">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto"
          style={{ maxHeight: '92vh' }}
        >
          {/* ── Aerial Hero Section ─── */}
          <div className="relative h-[160px] overflow-hidden flex-shrink-0 rounded-t-[20px]">
            <img src={heroUrl} alt={`Aerial view of ${selectedCity.name}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--k-bg)] via-[var(--k-bg)]/40 to-transparent" />

            {/* City name + controls overlaid */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
              <div className="flex items-end justify-between">
                <div>
                  <DrawerTitle className="font-syne text-[28px] font-extrabold text-white tracking-[-0.025em] leading-none drop-shadow-lg">
                    {selectedCity.name.split(',')[0]}
                  </DrawerTitle>
                  <p className="text-white/60 text-[12px] mt-1 tracking-[-0.01em] flex items-center gap-1.5">
                    {isLive && selectedCity.id === 'reno' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <Radio className="w-3 h-3 animate-pulse" /> Oracle Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <span className="live-dot" style={{ width: 6, height: 6 }} />
                        <span className="text-emerald-400 font-medium">Live data</span>
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => { onOpenChange(false); setTimeout(() => setFlyoverActive(true), 400); }}
                    className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10
                               flex items-center justify-center active:scale-90 transition-transform"
                    aria-label="Start flyover tour"
                  >
                    <Video className="w-4 h-4 text-white/80" />
                  </button>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff4d6a] to-[#a855f7]
                                  flex items-center justify-center shadow-[0_4px_16px_rgba(255,77,106,0.25)]">
                    <span className="font-syne font-extrabold text-white text-[12px]">KG</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Crowd Pulse Bar — thicker with segment gaps + busy glow ─── */}
          <div className="px-4 pt-3 pb-1 flex-shrink-0">
            <div className="flex gap-[1px] rounded-full overflow-hidden h-[4px] bg-[var(--k-fill-3)]">
              <div className="transition-all duration-700 rounded-full" style={{ width: `${quietPct}%`, backgroundColor: '#34d399' }} />
              <div className="transition-all duration-700 rounded-full" style={{ width: `${moderatePct}%`, backgroundColor: '#fbbf24' }} />
              <div className="transition-all duration-700 rounded-full" style={{ width: `${busyPct}%`, backgroundColor: '#ff4d6a', boxShadow: busyPct > 30 ? '0 0 6px rgba(255, 77, 106, 0.3)' : 'none' }} />
            </div>
          </div>

          {/* ── Pulse Strip — unified stats bar ─── */}
          <div className="px-4 py-2 flex-shrink-0">
            <div className="flex items-center px-3 py-2.5 rounded-2xl liquid-glass relative" style={{ boxShadow: 'var(--k-shadow-sm)' }}>
              <div className="flex-1 flex items-center justify-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#ff4d6a]" />
                <span className="text-[13px] font-extrabold text-[var(--k-text)]">{openCount}</span>
                <span className="text-[10px] text-[var(--k-text-m)] font-medium">Open</span>
              </div>
              <div className="w-px h-5 flex-shrink-0" style={{ background: 'linear-gradient(to bottom, transparent, var(--k-border), transparent)' }} />
              <div className="flex-1 flex items-center justify-center gap-1.5">
                <Users className="w-3 h-3 text-[#22d3ee]" />
                <span className="text-[13px] font-extrabold text-[var(--k-text)]">~{totalPeople}</span>
                <span className="text-[10px] text-[var(--k-text-m)] font-medium">Out</span>
              </div>
              <div className="w-px h-5 flex-shrink-0" style={{ background: 'linear-gradient(to bottom, transparent, var(--k-border), transparent)' }} />
              <div className="flex-1 flex items-center justify-center gap-1.5">
                <Flame className="w-3 h-3 text-[#fbbf24]" />
                <span className="text-[13px] font-extrabold text-[var(--k-text)] truncate max-w-[60px]">
                  {busyCount > 0 && busiestVenue ? busiestVenue.name.split(' ').slice(0, 2).join(' ') : busyCount}
                </span>
                <span className="text-[10px] text-[var(--k-text-m)] font-medium">Peak</span>
              </div>
              {busyCount > 0 && <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-[#ff4d6a] animate-pulse" />}
            </div>
          </div>

          {/* ── Quick Vibes — horizontal scroll with glass refraction ─── */}
          <div className="px-4 pb-3 flex-shrink-0">
            <p className="type-overline text-[var(--k-text-m)] mb-2">
              Quick Vibes
            </p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
              {VIBE_CARDS.map((card) => (
                <button
                  key={card.id}
                  data-vaul-no-drag
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => handleVibeTap(card.tab, card.typeFilter)}
                  style={{ scrollSnapAlign: 'start', transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  className={`relative w-[140px] flex-shrink-0 h-[72px] rounded-2xl bg-gradient-to-br ${card.gradient}
                             overflow-hidden ios-press text-left p-2.5 flex flex-col justify-end`}
                >
                  {/* Glass refraction overlay */}
                  <div className="absolute inset-0 bg-white/[0.05] rounded-2xl pointer-events-none" />
                  <card.Icon className="absolute top-1.5 right-1.5 w-10 h-10 text-white/[0.15] stroke-[1.5]" />
                  <p className="text-[13px] font-extrabold text-white tracking-[-0.02em] leading-tight relative z-[1]">
                    {card.title}
                  </p>
                  <p className="text-[9px] text-white/70 font-medium mt-0.5 relative z-[1]">
                    {card.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
            {/* Sticky tab bar */}
            <div className="px-4 pb-2 flex-shrink-0 sticky top-0 z-10 bg-[var(--k-bg)]/80 backdrop-blur-md pt-1">
              <TabsList className="w-full glass-chip p-[3px] !rounded-[16px] h-auto gap-0">
                <TabsTrigger value="restaurants" className={SEGMENT_CLASS}>Food & Bars</TabsTrigger>
                <TabsTrigger value="events" className={SEGMENT_CLASS}>Events</TabsTrigger>
                <TabsTrigger value="things" className={SEGMENT_CLASS}>Things to Do</TabsTrigger>
              </TabsList>
            </div>

            <SmartAlertBanner venues={venues} isLive={isLive && selectedCity.id === 'reno'} />

            <div>
              {/* ── Food & Bars ─────────────────────────── */}
              <TabsContent value="restaurants" className="m-0 pb-4 space-y-4">
                {/* Context filter pills + Saved toggle */}
                <div className="space-y-1.5">
                  <ContextFilters
                    crowdFilter={crowdFilter}
                    setCrowdFilter={setCrowdFilter}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    smartSort={smartSort}
                    setSmartSort={setSmartSort}
                    venueCounts={venueCounts}
                  />
                  {favorites.size > 0 && (
                    <div className="px-4">
                      <button
                        onClick={() => setShowFavs(!showFavs)}
                        data-vaul-no-drag
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95
                                    ${showFavs
                                      ? 'text-white shadow-[0_2px_16px_rgba(255,77,106,0.4)]'
                                      : 'bg-transparent border border-[var(--k-border)] text-[var(--k-text-m)] hover:text-[var(--k-text)]'
                                    }`}
                        style={showFavs ? { backgroundColor: '#ff4d6a' } : undefined}
                      >
                        <Heart className={`w-3 h-3 ${showFavs ? 'fill-white' : ''}`} />
                        Saved
                        <span className={`min-w-[16px] h-[16px] rounded-full text-[9px] font-bold flex items-center justify-center tabular-nums
                                         ${showFavs ? 'bg-white/20' : 'bg-[var(--k-fill-3)]'}`}>
                          {favorites.size}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Favorites Section ─── */}
                {showFavs && favoriteVenues.length > 0 && (
                  <div className="px-4">
                    <VenueSection
                      icon="❤️"
                      title="Your Saved Spots"
                      accentColor="#ff4d6a"
                      venues={favoriteVenues}
                      onVenueTap={handleVenueTap}
                      venueRefs={venueRefs}
                    />
                  </div>
                )}

                {/* Hot Right Now — trending carousel with scroll-snap + stagger */}
                <div>
                  <div className="flex items-center gap-2 px-4 mb-2">
                    <div className="w-[3px] h-[14px] rounded-full bg-[#ff4d6a]" />
                    <p className="text-[13px] font-extrabold text-[var(--k-text)] tracking-[-0.01em]">
                      Hot Right Now
                    </p>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4" style={{ scrollSnapType: 'x mandatory' }}>
                    {trending.map((venue, i) => (
                      <div
                        key={venue.id}
                        onClick={() => handleVenueTap(venue)}
                        data-vaul-no-drag
                        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                        className="w-[170px] flex-shrink-0 rounded-2xl overflow-hidden ios-press cursor-pointer glass-chip animate-fadeUp"
                        style={{ scrollSnapAlign: 'start', animationDelay: `${i * 0.06}s` }}
                      >
                        <div className="h-[140px] bg-[var(--k-surface)] overflow-hidden relative">
                          <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" loading="lazy" />
                          <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-sm
                                          ${venue.crowd === 'busy' ? 'bg-[#ff4d6a]/80 text-white' :
                                            venue.crowd === 'moderate' ? 'bg-amber-500/80 text-white' :
                                            'bg-emerald-500/80 text-white'}`}>
                            {venue.pct}%
                          </div>
                          {/* Rank number — larger */}
                          <span className="absolute bottom-2 left-2 text-[24px] font-extrabold text-white/80 drop-shadow-lg font-syne leading-none" style={{ fontFeatureSettings: "'tnum'" }}>
                            {i + 1}
                          </span>
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
                        </div>
                        <div className="p-2.5">
                          <h4 className="type-title-3 truncate text-[var(--k-text)] leading-tight">
                            {venue.icon} {venue.name}
                          </h4>
                          <p className="text-[10px] text-[var(--k-text-m)] mt-0.5 truncate">{venue.type} · {venue.dist}</p>
                          {venue.hasHH && (
                            <p className="text-[10px] text-[#ff8c42] mt-0.5 font-semibold truncate">{venue.hhDeal}</p>
                          )}
                          {venue.id === 'oracle-1' && pulse?.community_check && (
                            <p className="text-[9px] text-emerald-400 mt-0.5 font-medium truncate">
                              {pulse.community_check.thumbs_up} · Verified {pulse.community_check.last_verified}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Crowd-smart venue sections ─── */}
                <div className="space-y-4 px-4">
                  {sections.map((s) => (
                    <VenueSection
                      key={s.id}
                      icon={s.icon}
                      title={s.title}
                      accentColor={s.accentColor}
                      venues={s.venues}
                      onVenueTap={handleVenueTap}
                      venueRefs={venueRefs}
                    />
                  ))}

                  {/* Fallback: if no sections match filters, show flat list */}
                  {sections.length === 0 && filteredVenues.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-[var(--k-text-m)] uppercase tracking-[0.06em]">
                        All Venues
                      </p>
                      {filteredVenues.map((venue) => (
                        <div
                          key={venue.id}
                          ref={(el) => { if (el) venueRefs.current.set(venue.id, el); }}
                        >
                          <ExpandableVenueCard venue={venue} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {filteredVenues.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-[var(--k-text-m)] text-[14px] font-medium">No venues match filters</p>
                      <button
                        onClick={() => { setCrowdFilter('any'); setTypeFilter('all'); setSmartSort(false); }}
                        className="mt-2 text-[12px] text-[var(--k-accent)] font-bold"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Events ──────────────────────────────── */}
              <TabsContent value="events" className="m-0 px-4 pb-4 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-[#a855f7]" />
                    <p className="text-[11px] font-bold text-[#a855f7] uppercase tracking-[0.08em]">
                      Happening in {selectedCity.name}
                    </p>
                  </div>
                  {loading && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--k-text-m)] font-medium">
                      <Sparkles className="w-3 h-3 animate-spin" /> Loading
                    </div>
                  )}
                </div>

                {events.length > 0 ? (
                  events.map((event, i) => (
                    <div key={event.id} className="animate-fadeUp" style={{ animationDelay: `${i * 0.03}s` }}>
                      <EventCard event={event} />
                    </div>
                  ))
                ) : !loading ? (
                  <div className="text-center py-16">
                    <p className="text-[var(--k-text-m)] text-[15px] font-medium">No upcoming events</p>
                    <p className="text-[var(--k-text-f)] text-[13px] mt-1">Check back later</p>
                  </div>
                ) : null}
              </TabsContent>

              {/* ── Things to Do ────────────────────────── */}
              <TabsContent value="things" className="m-0 px-4 pb-4 space-y-2.5">
                <p className="type-overline text-[var(--k-text-m)] mb-1">
                  Explore {selectedCity.name}
                </p>
                {things.map((thing, i) => (
                  <div
                    key={thing.id}
                    className="flex gap-3 p-3 rounded-2xl bg-[var(--k-surface-solid)] border border-[var(--k-border)]
                               shadow-[var(--k-card-shadow)] ios-press transition-all animate-fadeUp"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--k-surface)] overflow-hidden flex-shrink-0">
                      <img src={thing.image} alt={thing.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[13px] text-[var(--k-text)] tracking-[-0.02em] leading-tight truncate">{thing.icon} {thing.name}</h4>
                      <p className="text-[11px] text-[var(--k-text-m)] mt-0.5 leading-[1.35] line-clamp-1">{thing.desc}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <CrowdPill crowd={thing.crowd} pct={thing.crowd === 'quiet' ? 25 : 55} />
                        {thing.coordinates && (
                          <button
                            onClick={(e) => { e.stopPropagation(); startDirections({ coords: thing.coordinates, name: thing.name }); onOpenChange(false); }}
                            aria-label={`Directions to ${thing.name}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff4d6a]/12 text-[#ff4d6a] text-[10px] font-bold
                                       active:scale-95 transition-transform"
                          >
                            <Navigation className="w-2.5 h-2.5" /> Go
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
