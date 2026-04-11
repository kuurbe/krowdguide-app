import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useAppContext } from '../../context';
import { CommandPalette } from '../search/CommandPalette';
import { CategoryPills } from './CategoryPills';
import type { Venue } from '../../types';
import type { QuickAction } from '../search/CommandPalette';

export function MapSearchBar({
  venues = [],
  onVenueSelect,
  onKGClick,
  onSearchResults,
  activeCategory,
  onCategoryChange,
}: {
  venues?: Venue[];
  onVenueSelect?: (venue: Venue) => void;
  onKGClick?: () => void;
  onSearchResults?: (venues: Venue[]) => void;
  activeCategory?: string;
  onCategoryChange?: (cat: string) => void;
}) {
  const { selectedCity } = useAppContext();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

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

  // Auto-show filters when a non-default category is active
  useEffect(() => {
    if (activeCategory && activeCategory !== 'All') {
      setFiltersVisible(true);
    }
  }, [activeCategory]);

  const handleVenueSelect = useCallback((venue: Venue) => {
    onVenueSelect?.(venue);
  }, [onVenueSelect]);

  const handleQuickAction = useCallback((action: QuickAction) => {
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

  const handleCategoryChange = useCallback((cat: string) => {
    onCategoryChange?.(cat);
    // Auto-hide pills when returning to "All"
    if (cat === 'All') setFiltersVisible(false);
  }, [onCategoryChange]);

  const isFiltered = activeCategory && activeCategory !== 'All';

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

        {/* Filter toggle — reveals category pills below */}
        <button
          onClick={() => setFiltersVisible(prev => !prev)}
          aria-label="Toggle filters"
          className={`w-[32px] h-[32px] rounded-[10px] flex items-center justify-center ios-press flex-shrink-0 transition-all
                     ${filtersVisible || isFiltered
                       ? 'bg-[var(--k-accent)]/15 text-[var(--k-accent)]'
                       : 'text-[var(--k-text-f)] hover:bg-[var(--k-surface-h)]'
                     }`}
        >
          <SlidersHorizontal className="w-[15px] h-[15px]" />
        </button>

        {/* KG Guide — shiny circular orb */}
        <button
          onClick={onKGClick}
          aria-label="Open City Guide"
          className="kg-orb flex-shrink-0 ios-press"
        >
          <span className="kg-orb-label">KG</span>
          <span className="kg-orb-glare" aria-hidden="true" />
        </button>
      </div>

      {/* Category filter pills — slide down when toggled */}
      {filtersVisible && activeCategory && onCategoryChange && (
        <div className="mt-2 animate-fadeUp">
          <CategoryPills active={activeCategory} onChange={handleCategoryChange} />
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        venues={venues}
        onVenueSelect={handleVenueSelect}
        onQuickAction={handleQuickAction}
        onSearchResults={onSearchResults}
      />
    </div>
  );
}
