import { useState, useMemo, useCallback } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { useAppContext } from '../../context';
import { useTicketmasterEvents } from '../../hooks/useTicketmasterEvents';
import { EventCard } from '../shared/EventCard';
import { Search, MapPin, Zap, Calendar, Bookmark } from 'lucide-react';
import type { Venue } from '../../types';

const CATEGORIES = [
  { id: 'nightlife', emoji: '🍸', name: 'Nightlife', subtitle: 'Quiet spots', keywords: ['bar', 'brewery', 'lounge', 'club', 'pub'] },
  { id: 'parks', emoji: '🌳', name: 'Parks', subtitle: 'Green zones', keywords: ['park', 'garden', 'trail', 'outdoor'] },
  { id: 'dining', emoji: '🍴', name: 'Dining', subtitle: 'Intimate cafes', keywords: ['restaurant', 'grill', 'bistro', 'diner', 'kitchen'] },
  { id: 'retail', emoji: '🛍️', name: 'Retail', subtitle: 'Boutique shops', keywords: ['shop', 'store', 'boutique', 'retail', 'market'] },
] as const;

type Tab = 'discover' | 'events';

export function CityGuideDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { selectedCity, venues, isLive, selectVenue } = useAppContext();
  const { events, loading: eventsLoading } = useTicketmasterEvents(selectedCity.name);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  const handleVenueTap = useCallback((venue: Venue) => {
    selectVenue(venue);
    onOpenChange(false);
  }, [selectVenue, onOpenChange]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="liquid-glass glass-border-glow rounded-t-[20px] h-[85vh] flex flex-col">

        {/* Header — always visible, not scrollable */}
        <div className="px-5 pt-5 pb-2 flex-shrink-0">
          <DrawerTitle className="font-syne text-[26px] font-extrabold text-[var(--k-text)] tracking-[-0.03em] leading-[1.15]">
            Find your{' '}
            <span className="text-[#ff6b6b]">quiet.</span>
          </DrawerTitle>
        </div>

        {/* Search bar — fixed */}
        <div className="px-5 pb-3 flex-shrink-0">
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

        {/* Tab switcher — fixed */}
        <div className="px-5 pb-3 flex-shrink-0">
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
              {/* Categories */}
              <div className="pb-4">
                <p className="type-overline text-[var(--k-text-m)] mb-2">Categories</p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      className="liquid-glass rounded-2xl p-3 text-left ios-press flex items-center gap-3"
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
                  ))}
                </div>
              </div>

              {/* Quiet Nearby */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="type-overline text-[var(--k-text-m)]">Quiet Nearby</p>
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
                    const densityColor = venue.crowd === 'quiet' ? '#34d399' : '#fbbf24';
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

                          {/* Density badges */}
                          <div className="flex items-center gap-2 mt-2.5">
                            <span className="glass-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ color: densityColor }}>
                              <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: densityColor }} />
                              {venue.pct}% Density
                            </span>
                            <span className="glass-chip inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold text-[var(--k-text-m)]">
                              {getDensityLabel(venue.crowd)}
                            </span>
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
                        {searchQuery ? 'No venues match your search' : 'No quiet spots nearby'}
                      </p>
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="mt-2 text-[12px] text-[#ff6b6b] font-bold">
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
