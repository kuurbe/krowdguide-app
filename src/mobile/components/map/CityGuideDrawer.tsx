import { useState, useMemo } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '../../context';
import { getVenuesForCity, getThingsForCity } from '../../data/venues';
import { useTicketmasterEvents } from '../../hooks/useTicketmasterEvents';
import { usePulseData } from '../../hooks/usePulseData';
import { VenueCard } from '../shared/VenueCard';
import { EventCard } from '../shared/EventCard';
import { CrowdPill } from '../shared/CrowdPill';
import { SmartAlertBanner } from '../shared/SmartAlertBanner';
import { Sparkles, Radio, Navigation, TrendingUp, Flame, Gem, UtensilsCrossed, Moon, Ticket } from 'lucide-react';
import { openDirections } from '../../utils/directions';

/** Segment control — premium glass style */
const SEGMENT_CLASS = `flex-1 py-[8px] text-[12px] font-bold !rounded-[12px] whitespace-nowrap
                       text-[var(--k-text-f)] border-none
                       data-[state=active]:bg-[var(--k-surface-solid)] data-[state=active]:text-[var(--k-text)]
                       data-[state=active]:shadow-[var(--k-card-shadow)] transition-all tracking-[-0.01em]`;

/** Discovery vibe cards */
const VIBE_CARDS = [
  {
    id: 'gems',
    title: 'Hidden Gems',
    subtitle: 'Off the beaten path',
    gradient: 'from-[#22d3ee] to-[#0891b2]',
    Icon: Gem,
    tab: 'things',
  },
  {
    id: 'food',
    title: 'Food & Drink',
    subtitle: 'Local favorites',
    gradient: 'from-[#ff4d6a] to-[#e63e58]',
    Icon: UtensilsCrossed,
    tab: 'restaurants',
  },
  {
    id: 'nightlife',
    title: 'Nightlife',
    subtitle: 'After dark spots',
    gradient: 'from-[#a855f7] to-[#7c3aed]',
    Icon: Moon,
    tab: 'restaurants',
  },
  {
    id: 'events',
    title: 'Events Nearby',
    subtitle: 'What\'s happening',
    gradient: 'from-[#fbbf24] to-[#f59e0b]',
    Icon: Ticket,
    tab: 'events',
  },
] as const;

export function CityGuideDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { selectedCity } = useAppContext();
  const [activeTab, setActiveTab] = useState('restaurants');
  const staticVenues = useMemo(() => getVenuesForCity(selectedCity.id), [selectedCity.id]);
  const things = useMemo(() => getThingsForCity(selectedCity.id), [selectedCity.id]);
  const { events, loading } = useTicketmasterEvents(selectedCity.name);
  const { liveVenue, isLive, pulse } = usePulseData();

  const venues = useMemo(() => {
    if (isLive && liveVenue && selectedCity.id === 'reno') {
      const filtered = staticVenues.filter(v => v.name !== liveVenue.name);
      return [liveVenue, ...filtered];
    }
    return staticVenues;
  }, [staticVenues, liveVenue, isLive, selectedCity.id]);

  const trending = useMemo(
    () => [...venues].sort((a, b) => b.pct - a.pct).slice(0, 4),
    [venues]
  );

  // Activity feed — derived from venue crowd data
  const activityChips = useMemo(() => {
    const busy = venues.filter(v => v.crowd === 'busy').length;
    const moderate = venues.filter(v => v.crowd === 'moderate').length;
    const quiet = venues.filter(v => v.crowd === 'quiet').length;
    const chips: { emoji: string; text: string }[] = [];
    if (busy > 0) chips.push({ emoji: '\u{1F37B}', text: `${busy * 3} at happy hours` });
    if (moderate > 0) chips.push({ emoji: '\u{1F6B6}', text: `${moderate * 2} exploring ${selectedCity.name.split(',')[0]}` });
    if (quiet > 0) chips.push({ emoji: '\u2615', text: `${quiet * 2} at coffee spots` });
    return chips;
  }, [venues, selectedCity.name]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[88vh] max-w-md mx-auto bg-[var(--k-bg)] border-[var(--k-border)] rounded-t-[20px]">
        <DrawerHeader className="pb-3 px-4 relative overflow-hidden flex-shrink-0">
          {/* Gradient glow header */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'linear-gradient(to bottom, rgba(255,77,106,0.06), transparent)' }} />
          <div className="flex items-center justify-between relative">
            <div className="min-w-0 flex-1">
              <DrawerTitle className="font-syne text-[20px] font-extrabold text-[var(--k-text)] tracking-tight">
                City Guide
              </DrawerTitle>
              <p className="text-[12px] text-[var(--k-text-m)] mt-0.5 tracking-[-0.01em] flex items-center gap-1.5">
                {selectedCity.name} · {isLive && selectedCity.id === 'reno' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <Radio className="w-3 h-3 animate-pulse" /> Oracle Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <span className="live-dot" style={{ width: 6, height: 6 }} />
                    <span className="text-emerald-400 font-medium">Live crowd data</span>
                  </span>
                )}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff4d6a] to-[#a855f7]
                            flex items-center justify-center flex-shrink-0 shadow-[0_4px_16px_rgba(255,77,106,0.25)]">
              <span className="font-syne font-extrabold text-white text-[12px]">KG</span>
            </div>
          </div>
        </DrawerHeader>

        {/* ── Select Your Vibe — 2x2 gradient cards ─── */}
        <div className="px-4 pb-3 flex-shrink-0">
          <p className="text-[11px] font-bold text-[var(--k-text-m)] uppercase tracking-[0.06em] mb-2">
            Select Your Vibe
          </p>
          <div className="grid grid-cols-2 gap-2">
            {VIBE_CARDS.map((card) => (
              <button
                key={card.id}
                onClick={() => setActiveTab(card.tab)}
                className={`relative h-[88px] rounded-2xl bg-gradient-to-br ${card.gradient}
                           overflow-hidden ios-press transition-all text-left p-3 flex flex-col justify-end`}
              >
                {/* Watermark icon */}
                <card.Icon className="absolute top-2 right-2 w-10 h-10 text-white/[0.15] stroke-[1.5]" />
                <p className="text-[14px] font-extrabold text-white tracking-[-0.02em] leading-tight relative z-[1]">
                  {card.title}
                </p>
                <p className="text-[10px] text-white/70 font-medium mt-0.5 relative z-[1]">
                  {card.subtitle}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Activity Feed — horizontal scroll ─── */}
        {activityChips.length > 0 && (
          <div className="px-4 pb-3 flex-shrink-0">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {activityChips.map((chip, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-[6px] rounded-full
                             bg-[var(--k-surface)] border border-[var(--k-border-s)]
                             text-[11px] font-semibold text-[var(--k-text-2)] whitespace-nowrap flex-shrink-0"
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="px-4 pb-3 flex-shrink-0">
            <TabsList className="w-full bg-[var(--k-fill-3)] p-[3px] !rounded-[14px] h-auto gap-0">
              <TabsTrigger value="restaurants" className={SEGMENT_CLASS}>Food & Bars</TabsTrigger>
              <TabsTrigger value="events" className={SEGMENT_CLASS}>Events</TabsTrigger>
              <TabsTrigger value="things" className={SEGMENT_CLASS}>Things to Do</TabsTrigger>
            </TabsList>
          </div>

          <SmartAlertBanner venues={venues} isLive={isLive && selectedCity.id === 'reno'} />

          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* ── Food & Bars ─────────────────────────── */}
            <TabsContent value="restaurants" className="m-0 pb-4 space-y-4">
              {/* Trending horizontal carousel */}
              <div>
                <div className="flex items-center gap-2 px-4 mb-2.5">
                  <Flame className="w-3.5 h-3.5 text-[#ff4d6a]" />
                  <p className="text-[11px] font-bold text-[#ff4d6a] uppercase tracking-[0.08em]">
                    Trending Now
                  </p>
                </div>
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4">
                  {trending.map((venue) => (
                    <div
                      key={venue.id}
                      className="w-[200px] flex-shrink-0 rounded-2xl overflow-hidden ios-press transition-all
                                 bg-[var(--k-surface-solid)] border border-[var(--k-border)] shadow-[var(--k-card-shadow)]"
                    >
                      <div className="h-[90px] bg-[var(--k-surface)] overflow-hidden relative">
                        <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" loading="lazy" />
                        {/* Load percentage badge */}
                        <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold
                                        ${venue.crowd === 'busy' ? 'bg-[#ff4d6a]/90 text-white' :
                                          venue.crowd === 'moderate' ? 'bg-amber-500/90 text-white' :
                                          'bg-emerald-500/90 text-white'}`}>
                          {venue.pct}% LOAD
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                      <div className="p-2.5">
                        <h4 className="font-bold text-[13px] truncate text-[var(--k-text)] tracking-[-0.02em] leading-tight">
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

              {/* All venues list */}
              <div className="space-y-2 px-4">
                <p className="text-[11px] font-bold text-[var(--k-text-m)] uppercase tracking-[0.06em]">
                  All Venues
                </p>
                {venues.map((venue, i) => (
                  <div key={venue.id} className="animate-fadeUp" style={{ animationDelay: `${i * 0.03}s` }}>
                    <VenueCard venue={venue} />
                  </div>
                ))}
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
              <p className="text-[11px] font-bold text-[var(--k-text-m)] uppercase tracking-[0.06em] mb-1">
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
                          onClick={(e) => { e.stopPropagation(); openDirections(thing.coordinates[0], thing.coordinates[1], thing.name); }}
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
      </DrawerContent>
    </Drawer>
  );
}
