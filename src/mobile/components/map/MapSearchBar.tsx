import { useState, useEffect, useCallback } from 'react';
import { Search, Compass } from 'lucide-react';
import { useAppContext } from '../../context';
import { CommandPalette } from '../search/CommandPalette';
import type { Venue } from '../../types';
import type { QuickAction } from '../search/CommandPalette';

export function MapSearchBar({
  venues = [],
  onVenueSelect,
  onKGClick,
}: {
  venues?: Venue[];
  onVenueSelect?: (venue: Venue) => void;
  onKGClick?: () => void;
}) {
  const { selectedCity } = useAppContext();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleVenueSelect = useCallback((venue: Venue) => {
    onVenueSelect?.(venue);
  }, [onVenueSelect]);

  const handleQuickAction = useCallback((action: QuickAction) => {
    // Quick actions — filter or select venues based on action type
    if (action === 'busy') {
      const busiest = venues.filter(v => v.crowd === 'busy').sort((a, b) => b.pct - a.pct)[0];
      if (busiest) onVenueSelect?.(busiest);
    } else if (action === 'quiet') {
      const quietest = venues.filter(v => v.crowd === 'quiet').sort((a, b) => a.pct - b.pct)[0];
      if (quietest) onVenueSelect?.(quietest);
    } else if (action === 'hh') {
      const hh = venues.find(v => v.hasHH);
      if (hh) onVenueSelect?.(hh);
    } else if (action === 'nearest') {
      const nearest = venues.sort((a, b) => {
        const distA = parseFloat(a.dist) || 99;
        const distB = parseFloat(b.dist) || 99;
        return distA - distB;
      })[0];
      if (nearest) onVenueSelect?.(nearest);
    }
  }, [venues, onVenueSelect]);

  return (
    <div className="absolute top-4 left-4 right-4 z-[1010]">
      <div
        className="flex items-center gap-2 py-[10px] pl-3.5 pr-2.5 rounded-[20px]
                    liquid-glass
                    shadow-[var(--k-shadow-md)]"
      >
        <Search className="w-[16px] h-[16px] text-[var(--k-text-m)] flex-shrink-0 opacity-60" />
        {/* Tap target — opens command palette */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex-1 text-left text-[15px] text-[var(--k-text-f)] tracking-[-0.01em]"
        >
          Search {selectedCity.name}...
        </button>
        {/* KG Guide module button */}
        <button
          onClick={onKGClick}
          aria-label="Open City Guide"
          className="flex items-center gap-1.5 h-[32px] px-3 rounded-[10px]
                     bg-gradient-to-r from-[var(--k-accent)] to-[var(--k-accent-3)]
                     text-white text-[11px] font-bold tracking-wide uppercase
                     shadow-[0_2px_8px_rgba(255,77,106,0.25)]
                     ios-press flex-shrink-0"
        >
          <Compass className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>KG</span>
        </button>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        venues={venues}
        onVenueSelect={handleVenueSelect}
        onQuickAction={handleQuickAction}
      />
    </div>
  );
}
