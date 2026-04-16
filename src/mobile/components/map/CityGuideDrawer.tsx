import { useState, useMemo, useCallback } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { useAppContext } from '../../context';
import { useTicketmasterEvents } from '../../hooks/useTicketmasterEvents';
import { useWeather } from '../../hooks/useWeather';
import { EventCard } from '../shared/EventCard';
import { Sparkline, generateForecast } from '../shared/Sparkline';
import { PeekPreview } from '../shared/PeekPreview';
import { usePressHold } from '../../hooks/usePressHold';
import { QuestCard } from '../shared/QuestCard';
import { NeighborhoodStrip } from '../shared/NeighborhoodStrip';
import { getNeighborhoodsForCity, type Neighborhood } from '../../data/neighborhoods';
import { getFriendsForCity } from '../../data/friends';
import { getQuestsForCity } from '../../data/quests';
import { SwipeStack } from '../shared/SwipeStack';
import { haptic } from '../../utils/haptics';
import {
  Search, Zap, Calendar, Bookmark,
  Cloud, CloudRain, CloudSnow, CloudLightning, CloudSun, Sun, Wind, CloudFog,
  Layers, Hand,
} from 'lucide-react';
import type { Venue, WeatherIcon } from '../../types';
import { VenueIcon } from '../../utils/icons';

const CATEGORIES = [
  { id: 'nightlife', iconId: 'cocktail', name: 'Nightlife', subtitle: 'Hot spots', keywords: ['bar', 'brewery', 'lounge', 'club', 'pub'] },
  { id: 'parks', iconId: 'tree', name: 'Parks', subtitle: 'Green zones', keywords: ['park', 'garden', 'trail', 'outdoor'] },
  { id: 'dining', iconId: 'utensils', name: 'Dining', subtitle: 'Intimate cafes', keywords: ['restaurant', 'grill', 'bistro', 'diner', 'kitchen'] },
  { id: 'retail', iconId: 'shopping', name: 'Retail', subtitle: 'Boutique shops', keywords: ['shop', 'store', 'boutique', 'retail', 'market'] },
] as const;

type Tab = 'discover' | 'events';
type CategoryId = typeof CATEGORIES[number]['id'];

const WEATHER_ICONS: Record<WeatherIcon, typeof Cloud> = {
  sun: Sun, cloud: Cloud, 'cloud-sun': CloudSun, 'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow, 'cloud-lightning': CloudLightning, 'cloud-fog': CloudFog, wind: Wind,
};

/** Adaptive theming based on time of day */
function getTimeContext() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return { label: 'Morning', greeting: 'Good morning', accent: 'var(--k-color-orange)', featured: 'dining' as CategoryId };
  if (hour >= 11 && hour < 17) return { label: 'Afternoon', greeting: 'Good afternoon', accent: 'var(--k-color-amber)', featured: 'parks' as CategoryId };
  if (hour >= 17 && hour < 21) return { label: 'Evening', greeting: 'Good evening', accent: 'var(--k-color-coral)', featured: 'dining' as CategoryId };
  return { label: 'Night', greeting: 'Good night', accent: 'var(--k-color-purple)', featured: 'nightlife' as CategoryId };
}

export function CityGuideDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { selectedCity, venues, isLive, selectVenue, startDirections } = useAppContext();
  const { events, loading: eventsLoading } = useTicketmasterEvents(selectedCity.name);
  const { weather } = useWeather(selectedCity.coordinates);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [swipeMode, setSwipeMode] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const cityNeighborhoods = useMemo(() => getNeighborhoodsForCity(selectedCity.id), [selectedCity.id]);
  const cityFriends = useMemo(() => getFriendsForCity(selectedCity.id), [selectedCity.id]);
  const [peekedVenue, setPeekedVenue] = useState<Venue | null>(null);

  const timeCtx = useMemo(() => getTimeContext(), []);
  const WeatherIconComponent = weather ? WEATHER_ICONS[weather.icon] ?? Cloud : Cloud;

  const toggleFavorite = useCallback((e: React.MouseEvent, venueId: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(venueId) ? next.delete(venueId) : next.add(venueId);
      return next;
    });
  }, []);

  const getAvatars = (name: string) => {
    const words = name.split(/\s+/).filter(Boolean);
    const initials: string[] = [];
    if (words[0]) initials.push(words[0].slice(0, 1).toUpperCase() + (words[0][1] || '').toLowerCase());
    if (words[1]) initials.push(words[1].slice(0, 1).toUpperCase() + (words[1][1] || '').toLowerCase());
    if (initials.length < 2 && words[0]?.length > 1) initials.push(words[0].slice(1, 3));
    return initials;
  };

  const getPullQuote = (venue: Venue) => {
    if (venue.hhDeal) return venue.hhDeal;
    if (venue.crowd === 'quiet') return 'Super chill vibes tonight';
    return 'Pleasantly low-key right now';
  };

  const getDensityLabel = (crowd: string) => {
    if (crowd === 'quiet') return 'Very Quiet';
    return 'Moderate';
  };

  const quietVenues = useMemo(() =>
    venues
      .filter(v => v.crowd === 'quiet' || v.crowd === 'moderate')
      .filter(v => !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8),
    [venues, searchQuery]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      counts[cat.id] = venues.filter(v =>
        cat.keywords.some(kw => v.type.toLowerCase().includes(kw))
      ).length;
    }
    return counts;
  }, [venues]);

  /** Reorder categories so the time-featured one comes first */
  const orderedCategories = useMemo(() => {
    const featured = CATEGORIES.find(c => c.id === timeCtx.featured);
    const rest = CATEGORIES.filter(c => c.id !== timeCtx.featured);
    return featured ? [featured, ...rest] : [...CATEGORIES];
  }, [timeCtx.featured]);

  // bentoStats removed — replaced by NeighborhoodGrid + FocusCard hero

  const handleVenueTap = useCallback((venue: Venue) => {
    selectVenue(venue);
    onOpenChange(false);
  }, [selectVenue, onOpenChange]);

  /** Time-context section label for unified feed */
  const sectionLabel = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `This morning in ${selectedCity.name}`;
    if (hour >= 12 && hour < 17) return `This afternoon in ${selectedCity.name}`;
    return `Tonight in ${selectedCity.name}`;
  }, [selectedCity.name]);

  /** Featured quest (first available for city) */
  const featuredQuest = useMemo(() => {
    const qs = getQuestsForCity(selectedCity.id);
    return qs.length > 0 ? qs[0] : null;
  }, [selectedCity.id]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="liquid-glass glass-border-glow rounded-t-[20px] h-[85vh] flex flex-col">

        {/* Header — always visible, not scrollable */}
        <div className="px-5 pt-5 pb-1 flex-shrink-0">
          <p className="type-overline text-[var(--k-text-m)] mb-1" style={{ color: timeCtx.accent }}>
            {timeCtx.greeting} &middot; {selectedCity.name}
          </p>
          <DrawerTitle className="font-syne text-[24px] font-extrabold text-[var(--k-text)] tracking-[-0.03em] leading-[1.15] whitespace-nowrap">
            Find Your <span className="text-[var(--k-color-coral)]">Crowd.</span>
          </DrawerTitle>
        </div>

        {/* Tab switcher — fixed */}
        <div className="px-5 pt-3 pb-3 flex-shrink-0">
          <div className="flex gap-1 p-1 rounded-[14px] glass-chip">
            {([
              { id: 'discover' as Tab, label: 'Discover' },
              { id: 'events' as Tab, label: `Events${events.length ? ` (${events.length})` : ''}` },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => { haptic('light'); setActiveTab(t.id); }}
                className={`flex-1 py-2 rounded-[12px] text-[13px] font-bold transition-all
                  ${activeTab === t.id ? 'bg-[var(--k-accent)] text-white shadow-md' : 'text-[var(--k-text-m)]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">

          {activeTab === 'discover' ? (
            <>
              {/* Neighborhood selector strip */}
              <div className="pb-3">
                <NeighborhoodStrip
                  neighborhoods={cityNeighborhoods}
                  selectedId={selectedNeighborhood?.id ?? null}
                  onSelect={setSelectedNeighborhood}
                  friends={cityFriends}
                />
              </div>

              {/* Weather + events mini row (kept, compact) */}
              <div className="flex items-center gap-2 pb-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-chip flex-shrink-0">
                  <WeatherIconComponent className="w-3.5 h-3.5 text-[var(--k-color-cyan)]" />
                  <span className="text-[11px] font-bold text-[var(--k-text)]">
                    {weather?.temperature ?? '--'}°
                  </span>
                  <span className="text-[10px] text-[var(--k-text-m)]">
                    {weather?.description?.split(' ')[0] || 'Clear'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-chip flex-shrink-0">
                  <span className="text-[11px] font-black text-[var(--k-color-coral)]">
                    {events.length || 3}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--k-text-m)] uppercase tracking-wider">
                    Tonight
                  </span>
                </div>
              </div>

              {/* Compact search */}
              <div className="pb-3">
                <div className="glass-chip flex items-center gap-2.5 px-3.5 py-2 rounded-full">
                  <Search className="w-4 h-4 text-[var(--k-text-f)] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search venues, areas or vibes"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-[13px] text-[var(--k-text)] placeholder:text-[var(--k-text-f)] outline-none"
                  />
                </div>
              </div>

              {/* Categories — compact 4x1 pill row */}
              <div className="pb-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {orderedCategories.map((cat) => (
                    <button
                      key={cat.id}
                      className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full glass-chip ios-press whitespace-nowrap"
                    >
                      <VenueIcon iconId={cat.iconId} className="w-4 h-4 text-[var(--k-text-m)]" />
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-[var(--k-text)] leading-none">{cat.name}</p>
                        <p className="text-[9px] text-[var(--k-text-f)] leading-none mt-0.5">{categoryCounts[cat.id] || 0}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Unified feed — section header with mode toggle */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="type-overline text-[var(--k-text-m)]">{sectionLabel}</p>
                  {isLive && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                      <Zap className="w-2.5 h-2.5" /> LIVE
                    </span>
                  )}
                  <button
                    onClick={() => setSwipeMode((s) => !s)}
                    className="ml-auto glass-chip w-8 h-8 rounded-full flex items-center justify-center ios-press"
                    aria-label={swipeMode ? 'Show list view' : 'Show swipe view'}
                    title={swipeMode ? 'List view' : 'Swipe view'}
                    style={swipeMode ? { boxShadow: `inset 0 0 0 1px ${timeCtx.accent}88` } : undefined}
                  >
                    {swipeMode ? (
                      <Layers className="w-4 h-4 text-[var(--k-text-m)]" />
                    ) : (
                      <Hand className="w-4 h-4 text-[var(--k-text-m)]" />
                    )}
                  </button>
                </div>

                {swipeMode ? (
                  <SwipeStack
                    venues={quietVenues}
                    onSave={(venue) => console.log('Saved:', venue.name)}
                    onSkip={(venue) => console.log('Skipped:', venue.name)}
                    onDirections={(venue) =>
                      startDirections({ coords: venue.coordinates, name: venue.name }, 'walking')
                    }
                    onExit={() => setSwipeMode(false)}
                  />
                ) : (
                  <div className="space-y-3">
                    {/* Featured quest — first item in feed */}
                    {featuredQuest && (
                      <QuestCard quest={featuredQuest} />
                    )}

                    {/* Popular venues — 3-4 max */}
                    {quietVenues.slice(0, 4).map((venue) => (
                      <PopularVenueCard
                        key={venue.id}
                        venue={venue}
                        isFav={favorites.has(venue.id)}
                        avatars={getAvatars(venue.name)}
                        pullQuote={getPullQuote(venue)}
                        densityLabel={getDensityLabel(venue.crowd)}
                        onTap={handleVenueTap}
                        onPeek={setPeekedVenue}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}

                    {quietVenues.length === 0 && !featuredQuest && (
                      <div className="text-center py-10">
                        <p className="text-[var(--k-text-m)] text-[14px]">
                          {searchQuery ? 'No venues match your search' : 'No popular spots nearby'}
                        </p>
                        {searchQuery && (
                          <button onClick={() => setSearchQuery('')} className="mt-2 text-[12px] text-[var(--k-color-coral)] font-bold">
                            Clear search
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Events Tab */
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-[var(--k-accent)]" />
                <p className="type-overline text-[var(--k-text-m)]">Events in {selectedCity.name}</p>
              </div>

              {eventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-[120px] rounded-2xl skeleton-shimmer" />
                  ))}
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-8 h-8 text-[var(--k-text-f)] mx-auto mb-3" />
                  <p className="text-[15px] font-semibold text-[var(--k-text-m)]">No upcoming events</p>
                  <p className="text-[12px] text-[var(--k-text-f)] mt-1">Check back later for events in {selectedCity.name}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <PeekPreview
          venue={peekedVenue}
          onClose={() => setPeekedVenue(null)}
          onOpenFull={(v) => {
            // Close peek FIRST, then open venue sheet (prevents orphan overlay)
            setPeekedVenue(null);
            setTimeout(() => handleVenueTap(v), 50);
          }}
          onDirections={(v) => {
            setPeekedVenue(null);
            setTimeout(() => {
              startDirections({ coords: v.coordinates, name: v.name }, 'walking');
              onOpenChange(false);
            }, 50);
          }}
        />
      </DrawerContent>
    </Drawer>
  );
}

interface PopularVenueCardProps {
  venue: Venue;
  isFav: boolean;
  avatars: string[];
  pullQuote: string;
  densityLabel: string;
  onTap: (venue: Venue) => void;
  onPeek: (venue: Venue) => void;
  onToggleFavorite: (e: React.MouseEvent, venueId: string) => void;
}

function PopularVenueCard({
  venue,
  isFav,
  avatars,
  pullQuote,
  densityLabel,
  onTap,
  onPeek,
  onToggleFavorite,
}: PopularVenueCardProps) {
  const densityColor = venue.crowd === 'quiet' ? 'var(--k-color-green)' : 'var(--k-color-amber)';
  const extraCount = Math.max(0, Math.floor(venue.pct / 8));

  const pressHoldHandlers = usePressHold(() => {
    onPeek(venue);
  });

  return (
    <button
      onClick={() => onTap(venue)}
      className="w-full rounded-2xl liquid-glass ios-press text-left overflow-hidden"
      {...pressHoldHandlers}
    >
      {/* Full-width image */}
      <div className="w-full h-[160px] bg-[var(--k-surface)] relative">
        {venue.image ? (
          <img src={venue.image} alt={venue.name} className="w-full h-[160px] rounded-t-2xl object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center rounded-t-2xl bg-[var(--k-fill-3)]"><VenueIcon iconId={venue.icon} className="w-10 h-10 text-[var(--k-text-f)]" /></div>
        )}
      </div>

      {/* Content below image */}
      <div className="px-3.5 pt-3 pb-3">
        {/* Name + bookmark */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-[18px] font-bold text-[var(--k-text)] leading-tight truncate">{venue.name}</h4>
          <div
            onClick={(e) => onToggleFavorite(e, venue.id)}
            className="flex-shrink-0 mt-0.5"
          >
            <Bookmark
              className="w-5 h-5"
              fill={isFav ? 'currentColor' : 'none'}
              stroke="currentColor"
              style={{ color: isFav ? '#ff6b6b' : 'var(--k-text-f)' }}
            />
          </div>
        </div>

        {/* Type + distance */}
        <p className="text-[13px] text-[var(--k-text-m)] italic mt-0.5 truncate">
          {venue.type} &middot; {venue.dist}
        </p>

        {/* Density badges + 6h forecast sparkline */}
        <div className="flex items-center gap-2 mt-2.5">
          <span className="glass-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ color: densityColor }}>
            <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: densityColor }} />
            {venue.pct}% Density
          </span>
          <span className="glass-chip inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold text-[var(--k-text-m)]">
            {densityLabel}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <Sparkline
              values={generateForecast(venue.id, venue.pct, 6)}
              width={48}
              height={18}
              color={venue.crowd === 'busy' ? 'var(--k-color-coral)' : venue.crowd === 'moderate' ? 'var(--k-color-amber)' : 'var(--k-color-green)'}
            />
            <span className="text-[9px] font-bold text-[var(--k-text-f)] uppercase tracking-wider">6h</span>
          </div>
        </div>

        {/* Avatars + pull quote */}
        <div className="flex items-center gap-2 mt-2.5">
          <div className="flex -space-x-1.5 flex-shrink-0">
            {avatars.map((init, i) => (
              <div
                key={i}
                className="w-[20px] h-[20px] rounded-full bg-[var(--k-accent)]/20 border border-[var(--k-surface)] flex items-center justify-center"
              >
                <span className="text-[8px] font-bold text-[var(--k-accent)]">{init}</span>
              </div>
            ))}
            {extraCount > 0 && (
              <div className="w-[20px] h-[20px] rounded-full bg-[var(--k-fill-3)] border border-[var(--k-surface)] flex items-center justify-center">
                <span className="text-[7px] font-bold text-[var(--k-text-f)]">+{extraCount}</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-[var(--k-text-f)] italic truncate">
            &ldquo;{pullQuote}&rdquo;
          </p>
        </div>
      </div>
    </button>
  );
}
