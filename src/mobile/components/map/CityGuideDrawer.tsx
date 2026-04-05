import { useState, useMemo, useCallback } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { useAppContext } from '../../context';
import { useTicketmasterEvents } from '../../hooks/useTicketmasterEvents';
import { EventCard } from '../shared/EventCard';
import { Search, MapPin, Zap, Calendar } from 'lucide-react';
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

                <div className="space-y-2">
                  {quietVenues.map((venue) => (
                    <button
                      key={venue.id}
                      onClick={() => handleVenueTap(venue)}
                      className="w-full flex gap-3 p-2.5 rounded-2xl liquid-glass ios-press text-left"
                    >
                      <div className="w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-[var(--k-surface)]">
                        {venue.image ? (
                          <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">{venue.icon}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[14px] font-bold text-[var(--k-text)] truncate">{venue.name}</h4>
                          <p className="text-[11px] text-[var(--k-text-m)] mt-0.5 truncate">{venue.type} · {venue.dist}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-[4px] rounded-full bg-[var(--k-fill-3)] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${venue.pct}%`,
                                backgroundColor: venue.crowd === 'quiet' ? '#34d399' : venue.crowd === 'moderate' ? '#fbbf24' : '#ff4d6a',
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-[var(--k-text-f)] tabular-nums w-[28px] text-right">{venue.pct}%</span>
                        </div>
                        {venue.hasHH && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-2.5 h-2.5 text-[var(--k-text-f)]" />
                            <span className="text-[10px] text-[#ff8c42] font-semibold truncate">{venue.hhDeal}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}

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
