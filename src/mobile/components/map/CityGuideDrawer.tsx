import { useState, useMemo, useCallback } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { useAppContext } from '../../context';
import { Search, ChevronRight, MapPin, Zap } from 'lucide-react';
import type { Venue } from '../../types';

/** Snap points */
const SNAP_PEEK = 0.35;
const SNAP_HALF = 0.60;
const SNAP_FULL = 0.92;
const SNAP_POINTS = [SNAP_PEEK, SNAP_HALF, SNAP_FULL];

/** Category cards for the 2x2 grid */
const CATEGORIES = [
  { id: 'nightlife', emoji: '🍸', name: 'Nightlife', count: 12, subtitle: 'quiet spots', keywords: ['bar', 'brewery', 'lounge', 'club', 'pub'] },
  { id: 'parks', emoji: '🌳', name: 'Parks', count: 8, subtitle: 'green places', keywords: ['park', 'garden', 'trail', 'outdoor'] },
  { id: 'dining', emoji: '🍴', name: 'Dining', count: 15, subtitle: 'boutique vibes', keywords: ['restaurant', 'grill', 'bistro', 'diner', 'kitchen'] },
  { id: 'retail', emoji: '🛍️', name: 'Retail', count: 5, subtitle: 'boutique vibes', keywords: ['shop', 'store', 'boutique', 'retail', 'market'] },
] as const;

/** Quick Vibes carousel cards */
const VIBE_CARDS = [
  { id: 'gems', title: 'Hidden Gems', subtitle: 'Off the beaten path', gradient: 'from-[#22d3ee] to-[#0891b2]' },
  { id: 'food', title: 'Food & Drink', subtitle: 'Local favorites', gradient: 'from-[#ff4d6a] to-[#e63e58]' },
  { id: 'nightlife', title: 'Nightlife', subtitle: 'After dark spots', gradient: 'from-[#a855f7] to-[#7c3aed]' },
  { id: 'events', title: 'Events Nearby', subtitle: "What's happening", gradient: 'from-[#fbbf24] to-[#f59e0b]' },
];

export function CityGuideDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    venues, isLive, selectVenue,
  } = useAppContext();

  const [snap, setSnap] = useState<number | string | null>(SNAP_HALF);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter quiet/moderate venues for "Quiet Nearby"
  const quietVenues = useMemo(() =>
    venues
      .filter(v => v.crowd === 'quiet' || v.crowd === 'moderate')
      .filter(v => !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 6),
    [venues, searchQuery]
  );

  // Category counts from real data
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      counts[cat.id] = venues.filter(v =>
        cat.keywords.some(kw => v.type.toLowerCase().includes(kw))
      ).length;
    }
    return counts;
  }, [venues]);

  // Tap venue -> open detail + close drawer
  const handleVenueTap = useCallback((venue: Venue) => {
    selectVenue(venue);
    onOpenChange(false);
  }, [selectVenue, onOpenChange]);

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={SNAP_POINTS}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      fadeFromIndex={0}
    >
      <DrawerContent className="liquid-glass glass-border-glow glass-inner-light rounded-t-[20px] max-h-[92vh] flex flex-col">
        <div className="flex-1 overflow-y-auto no-scrollbar overscroll-contain" data-vaul-no-drag>

          {/* ── Header: "Find your quiet." ─── */}
          <div className="px-5 pt-5 pb-3">
            <DrawerTitle className="font-syne text-[28px] font-extrabold text-[var(--k-text)] tracking-[-0.03em] leading-[1.15]">
              Find your{' '}
              <span className="text-[#ff6b6b] font-extrabold">quiet.</span>
            </DrawerTitle>
          </div>

          {/* ── Search Bar ─── */}
          <div className="px-5 pb-4">
            <div className="glass-chip flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl">
              <Search className="w-4 h-4 text-[var(--k-text-f)] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search venues, areas or vibes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-vaul-no-drag
                onPointerDown={(e) => e.stopPropagation()}
                className="flex-1 bg-transparent text-[14px] text-[var(--k-text)] placeholder:text-[var(--k-text-f)] outline-none font-medium tracking-[-0.01em]"
              />
            </div>
          </div>

          {/* ── Categories ─── */}
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="type-overline text-[var(--k-text-m)]">Categories</p>
              <button className="text-[11px] font-bold text-[#ff6b6b] tracking-[0.04em] uppercase ios-press">
                Browse All <ChevronRight className="w-3 h-3 inline -mt-px" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  data-vaul-no-drag
                  onPointerDown={(e) => e.stopPropagation()}
                  className="liquid-glass rounded-2xl p-3.5 text-left ios-press flex items-center gap-3 transition-transform"
                >
                  <div className="glass-chip w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[18px]">{cat.emoji}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[var(--k-text)] tracking-[-0.01em] leading-tight">
                      {cat.name}
                    </p>
                    <p className="text-[11px] text-[var(--k-text-f)] mt-0.5">
                      {categoryCounts[cat.id] || cat.count} {cat.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Quick Vibes Carousel ─── */}
          <div className="px-5 pb-4">
            <p className="type-overline text-[var(--k-text-m)] mb-2">Quick Vibes</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
              {VIBE_CARDS.map((card) => (
                <button
                  key={card.id}
                  data-vaul-no-drag
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ scrollSnapAlign: 'start' }}
                  className={`relative w-[130px] flex-shrink-0 h-[64px] rounded-2xl bg-gradient-to-br ${card.gradient}
                             overflow-hidden ios-press text-left p-2.5 flex flex-col justify-end`}
                >
                  <div className="absolute inset-0 bg-white/[0.05] rounded-2xl pointer-events-none" />
                  <p className="text-[12px] font-extrabold text-white tracking-[-0.02em] leading-tight relative z-[1]">
                    {card.title}
                  </p>
                  <p className="text-[9px] text-white/70 font-medium mt-0.5 relative z-[1]">
                    {card.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Quiet Nearby ─── */}
          <div className="px-5 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <p className="type-overline text-[var(--k-text-m)]">Quiet Nearby</p>
              {isLive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold tracking-[0.02em]">
                  <Zap className="w-2.5 h-2.5" />
                  LIVE
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {quietVenues.map((venue, i) => (
                <button
                  key={venue.id}
                  onClick={() => handleVenueTap(venue)}
                  data-vaul-no-drag
                  onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                  className="w-full flex gap-3 p-2.5 rounded-2xl liquid-glass ios-press text-left animate-fadeUp"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {/* Venue image */}
                  <div className="w-[80px] h-[80px] rounded-xl overflow-hidden flex-shrink-0 bg-[var(--k-surface)]">
                    {venue.image ? (
                      <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">{venue.icon}</div>
                    )}
                  </div>

                  {/* Venue info */}
                  <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[14px] font-bold text-[var(--k-text)] tracking-[-0.02em] leading-tight truncate">
                        {venue.name}
                      </h4>
                      <p className="text-[11px] text-[var(--k-text-m)] mt-0.5 truncate">
                        {venue.type}
                      </p>
                    </div>

                    {/* Crowd bar */}
                    <div className="mt-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-[4px] rounded-full bg-[var(--k-fill-3)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${venue.pct}%`,
                              backgroundColor: venue.crowd === 'quiet' ? '#34d399' :
                                venue.crowd === 'moderate' ? '#fbbf24' : '#ff4d6a',
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[var(--k-text-f)] tabular-nums w-[28px] text-right">
                          {venue.pct}%
                        </span>
                      </div>
                    </div>

                    {/* Distance + pull quote */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="w-2.5 h-2.5 text-[var(--k-text-f)]" />
                      <span className="text-[10px] text-[var(--k-text-f)] font-medium">{venue.dist}</span>
                      {venue.hasHH && (
                        <>
                          <span className="text-[var(--k-text-f)]">·</span>
                          <span className="text-[10px] text-[#ff8c42] font-semibold truncate">{venue.hhDeal}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {/* Empty state */}
              {quietVenues.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-[var(--k-text-m)] text-[14px] font-medium">
                    {searchQuery ? 'No venues match your search' : 'No quiet spots nearby'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-[12px] text-[#ff6b6b] font-bold"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
