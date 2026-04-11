import { useState, useMemo, useCallback } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { useAppContext } from '../../context';
import { useTicketmasterEvents } from '../../hooks/useTicketmasterEvents';
import { useWeather } from '../../hooks/useWeather';
import { EventCard } from '../shared/EventCard';
import { AskBar } from '../shared/AskBar';
import { Sparkline, generateForecast } from '../shared/Sparkline';
import {
  Search, Zap, Calendar, Bookmark, Activity, TrendingUp, Compass,
  Cloud, CloudRain, CloudSnow, CloudLightning, CloudSun, Sun, Wind, CloudFog,
} from 'lucide-react';
import type { Venue, WeatherIcon } from '../../types';

const CATEGORIES = [
  { id: 'nightlife', emoji: '🍸', name: 'Nightlife', subtitle: 'Hot spots', keywords: ['bar', 'brewery', 'lounge', 'club', 'pub'] },
  { id: 'parks', emoji: '🌳', name: 'Parks', subtitle: 'Green zones', keywords: ['park', 'garden', 'trail', 'outdoor'] },
  { id: 'dining', emoji: '🍴', name: 'Dining', subtitle: 'Intimate cafes', keywords: ['restaurant', 'grill', 'bistro', 'diner', 'kitchen'] },
  { id: 'retail', emoji: '🛍️', name: 'Retail', subtitle: 'Boutique shops', keywords: ['shop', 'store', 'boutique', 'retail', 'market'] },
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
  if (hour >= 5 && hour < 11) return { label: 'Morning', greeting: 'Good morning', accent: '#ff8c42', featured: 'dining' as CategoryId };
  if (hour >= 11 && hour < 17) return { label: 'Afternoon', greeting: 'Good afternoon', accent: '#fbbf24', featured: 'parks' as CategoryId };
  if (hour >= 17 && hour < 21) return { label: 'Evening', greeting: 'Good evening', accent: '#ff4d6a', featured: 'dining' as CategoryId };
  return { label: 'Night', greeting: 'Good night', accent: '#a855f7', featured: 'nightlife' as CategoryId };
}

export function CityGuideDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { selectedCity, venues, isLive, selectVenue } = useAppContext();
  const { events, loading: eventsLoading } = useTicketmasterEvents(selectedCity.name);
  const { weather } = useWeather(selectedCity.coordinates);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  /** Bento stats — avg crowd, crowd label, forecast sparkline */
  const bentoStats = useMemo(() => {
    const avgCrowd = venues.length
      ? Math.round(venues.reduce((acc, v) => acc + v.pct, 0) / venues.length)
      : 0;
    let crowdLabel = 'quiet';
    if (avgCrowd >= 65) crowdLabel = 'busy';
    else if (avgCrowd >= 35) crowdLabel = 'moderate';

    // Synthetic sparkline — simulated peak curve through the day
    const hour = new Date().getHours();
    const sparkline = Array.from({ length: 12 }, (_, i) => {
      const h = (hour - 5 + i + 24) % 24;
      const peak = Math.exp(-Math.pow((h - 21) / 4, 2)) * 0.8 + Math.exp(-Math.pow((h - 13) / 3, 2)) * 0.4;
      return Math.max(0.1, Math.min(1, peak + (i % 3) * 0.05));
    });

    return { avgCrowd, crowdLabel, sparkline };
  }, [venues]);

  const handleVenueTap = useCallback((venue: Venue) => {
    selectVenue(venue);
    onOpenChange(false);
  }, [selectVenue, onOpenChange]);

  const handleAsk = useCallback((prompt: string) => {
    // For now, just log it — real AI integration comes later
    console.log('[KG Ask]', prompt);
  }, []);

  // Build sparkline SVG path
  const sparkPath = useMemo(() => {
    const pts = bentoStats.sparkline;
    const w = 100;
    const h = 28;
    return pts
      .map((v, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h - v * h;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [bentoStats.sparkline]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="liquid-glass glass-border-glow rounded-t-[20px] h-[85vh] flex flex-col">

        {/* Header — always visible, not scrollable */}
        <div className="px-5 pt-5 pb-1 flex-shrink-0">
          <p className="type-overline text-[var(--k-text-m)] mb-1" style={{ color: timeCtx.accent }}>
            {timeCtx.greeting} &middot; {selectedCity.name}
          </p>
          <DrawerTitle className="font-syne text-[26px] font-extrabold text-[var(--k-text)] tracking-[-0.03em] leading-[1.15]">
            Find Your{' '}
            <span className="text-[var(--k-color-coral)]">Crowd.</span>
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
                onClick={() => setActiveTab(t.id)}
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
              {/* Ask the City AI bar */}
              <div className="pb-4">
                <AskBar
                  placeholder="Ask anything about your city..."
                  onSubmit={handleAsk}
                  suggestions={[
                    'Quietest coffee right now',
                    'Rooftops with sunset views',
                    'Where are my friends tonight?',
                  ]}
                />
              </div>

              {/* Bento-Grid Hero Dashboard — 3x3 grid */}
              <div className="pb-4">
                <div className="grid grid-cols-3 grid-rows-3 gap-2 h-[240px]">
                  {/* NOW HERE — large hero (2x2) */}
                  <div
                    className="col-span-2 row-span-2 liquid-glass rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden"
                    style={{ boxShadow: `inset 0 0 0 1px ${timeCtx.accent}33, 0 0 30px -8px ${timeCtx.accent}55` }}
                  >
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{ background: `radial-gradient(circle at 30% 20%, ${timeCtx.accent}, transparent 60%)` }}
                    />
                    <div className="relative">
                      <p className="type-overline text-[var(--k-text-f)] text-[9px]">NOW HERE</p>
                      <p className="text-[15px] font-bold text-[var(--k-text)] leading-tight truncate mt-0.5">
                        {selectedCity.name}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="flex items-baseline gap-1">
                        <p className="font-syne text-[38px] font-extrabold text-[var(--k-text)] leading-none tracking-[-0.03em]">
                          {bentoStats.avgCrowd}
                        </p>
                        <p className="text-[13px] font-bold text-[var(--k-text-m)]">%</p>
                      </div>
                      <p className="text-[10px] text-[var(--k-text-f)] mt-0.5">
                        it&apos;s <span style={{ color: timeCtx.accent }} className="font-bold">{bentoStats.crowdLabel}</span> right now
                      </p>
                      {weather && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <WeatherIconComponent className="w-3.5 h-3.5 text-[var(--k-color-cyan)]" />
                          <p className="text-[11px] font-bold text-[var(--k-text-m)]">
                            {weather.temperature}°F &middot; {weather.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VIBE — top-right (1x1) */}
                  <div className="liquid-glass rounded-2xl p-2.5 flex flex-col justify-between">
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-[var(--k-color-green)]" />
                      <p className="type-overline text-[var(--k-text-f)] text-[9px]">VIBE</p>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: 'energy', v: 0.7, color: 'var(--k-color-coral)' },
                        { label: 'noise', v: 0.5, color: 'var(--k-color-amber)' },
                        { label: 'crowd', v: bentoStats.avgCrowd / 100, color: 'var(--k-color-green)' },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-1">
                          <span className="text-[8px] text-[var(--k-text-f)] w-8 uppercase">{s.label}</span>
                          <div className="flex-1 flex gap-[2px]">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div
                                key={i}
                                className="flex-1 h-[3px] rounded-full"
                                style={{ backgroundColor: i < Math.round(s.v * 6) ? s.color : 'var(--k-fill-3)' }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FORECAST — middle-right (1x1) */}
                  <div className="liquid-glass rounded-2xl p-2.5 flex flex-col justify-between">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-[var(--k-color-coral)]" />
                      <p className="type-overline text-[var(--k-text-f)] text-[9px]">FORECAST</p>
                    </div>
                    <svg viewBox="0 0 100 28" className="w-full h-6" preserveAspectRatio="none">
                      <path
                        d={sparkPath}
                        fill="none"
                        stroke="var(--k-color-coral)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-[9px] text-[var(--k-text-f)] leading-tight">peaks at <span className="text-[var(--k-text-m)] font-bold">9pm</span></p>
                  </div>

                  {/* QUEST — bottom-left (2x1) */}
                  <div className="col-span-2 liquid-glass rounded-2xl p-2.5 flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${timeCtx.accent}22` }}
                    >
                      <Compass className="w-4 h-4" style={{ color: timeCtx.accent }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="type-overline text-[var(--k-text-f)] text-[9px]">QUEST</p>
                      <p className="text-[11px] font-bold text-[var(--k-text)] leading-tight truncate">
                        4-stop quiet cafe crawl
                      </p>
                      <p className="text-[9px] text-[var(--k-text-f)] truncate">AI-curated &middot; ~90 min</p>
                    </div>
                  </div>

                  {/* WEATHER — bottom-right (1x1) */}
                  <div className="liquid-glass rounded-2xl p-2.5 flex flex-col justify-between">
                    <div className="flex items-center gap-1">
                      <WeatherIconComponent className="w-3 h-3 text-[var(--k-color-cyan)]" />
                      <p className="type-overline text-[var(--k-text-f)] text-[9px]">WEATHER</p>
                    </div>
                    {weather ? (
                      <>
                        <p className="font-syne text-[20px] font-extrabold text-[var(--k-text)] leading-none">
                          {weather.temperature}°
                        </p>
                        <p className="text-[8px] text-[var(--k-text-f)] leading-tight">good patio weather</p>
                      </>
                    ) : (
                      <p className="text-[9px] text-[var(--k-text-f)]">loading…</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Secondary search bar */}
              <div className="pb-4">
                <div className="glass-chip flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl">
                  <Search className="w-4 h-4 text-[var(--k-text-f)] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search venues, areas or vibes"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-[14px] text-[var(--k-text)] placeholder:text-[var(--k-text-f)] outline-none"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="pb-4">
                <p className="type-overline text-[var(--k-text-m)] mb-2">Categories</p>
                <div className="grid grid-cols-2 gap-2">
                  {orderedCategories.map((cat) => {
                    const isFeatured = cat.id === timeCtx.featured;
                    return (
                      <button
                        key={cat.id}
                        className="liquid-glass rounded-2xl p-3 text-left ios-press flex items-center gap-3"
                        style={isFeatured ? { boxShadow: `inset 0 0 0 1px ${timeCtx.accent}55` } : undefined}
                      >
                        <div className="glass-chip w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[16px]">{cat.emoji}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[var(--k-text)] leading-tight">{cat.name}</p>
                          <p className="text-[10px] text-[var(--k-text-f)] mt-0.5">
                            {categoryCounts[cat.id] || 0} {cat.subtitle.toLowerCase()}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Popular Nearby */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="type-overline text-[var(--k-text-m)]">Popular Nearby</p>
                  {isLive && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                      <Zap className="w-2.5 h-2.5" /> LIVE
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {quietVenues.map((venue) => {
                    const avatars = getAvatars(venue.name);
                    const isFav = favorites.has(venue.id);
                    const densityColor = venue.crowd === 'quiet' ? 'var(--k-color-green)' : 'var(--k-color-amber)';
                    const extraCount = Math.max(0, Math.floor(venue.pct / 8));

                    return (
                      <button
                        key={venue.id}
                        onClick={() => handleVenueTap(venue)}
                        className="w-full rounded-2xl liquid-glass ios-press text-left overflow-hidden"
                      >
                        {/* Full-width image */}
                        <div className="w-full h-[160px] bg-[var(--k-surface)] relative">
                          {venue.image ? (
                            <img src={venue.image} alt={venue.name} className="w-full h-[160px] rounded-t-2xl object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl rounded-t-2xl bg-[var(--k-fill-3)]">{venue.icon}</div>
                          )}
                        </div>

                        {/* Content below image */}
                        <div className="px-3.5 pt-3 pb-3">
                          {/* Name + bookmark */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-[18px] font-bold text-[var(--k-text)] leading-tight truncate">{venue.name}</h4>
                            <div
                              onClick={(e) => toggleFavorite(e, venue.id)}
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
                              {getDensityLabel(venue.crowd)}
                            </span>
                            <div className="ml-auto flex items-center gap-1.5">
                              <Sparkline
                                values={generateForecast(venue.id, venue.pct, 6)}
                                width={48}
                                height={18}
                                color={venue.crowd === 'busy' ? '#ff4d6a' : venue.crowd === 'moderate' ? '#fbbf24' : '#34d399'}
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
                              &ldquo;{getPullQuote(venue)}&rdquo;
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {quietVenues.length === 0 && (
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
      </DrawerContent>
    </Drawer>
  );
}
