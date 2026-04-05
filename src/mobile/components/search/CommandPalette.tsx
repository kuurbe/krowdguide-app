import { useCallback } from 'react';
import { Command } from 'cmdk';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { CrowdPill } from '../shared/CrowdPill';
import { Flame, Volume1, Beer, MapPin, Coffee, UtensilsCrossed, Moon, Trees, Map } from 'lucide-react';
import type { Venue } from '../../types';

const QUICK_ACTIONS = [
  { id: 'busy', label: 'Show busy venues', Icon: Flame, color: '#ff4d6a' },
  { id: 'quiet', label: 'Find quiet spots', Icon: Volume1, color: '#34d399' },
  { id: 'hh', label: 'Happy hour deals', Icon: Beer, color: '#ff8c42' },
  { id: 'nearest', label: 'Nearest venue', Icon: MapPin, color: '#22d3ee' },
] as const;

const CATEGORIES = [
  { id: 'bar', label: 'Bars & Nightlife', Icon: Moon },
  { id: 'restaurant', label: 'Restaurants', Icon: UtensilsCrossed },
  { id: 'coffee', label: 'Coffee & Café', Icon: Coffee },
  { id: 'park', label: 'Parks & Outdoors', Icon: Trees },
] as const;

export type QuickAction = typeof QUICK_ACTIONS[number]['id'];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venues: Venue[];
  onVenueSelect: (venue: Venue) => void;
  onQuickAction?: (action: QuickAction) => void;
  onSearchResults?: (venues: Venue[]) => void;
}

export function CommandPalette({ open, onOpenChange, venues, onVenueSelect, onQuickAction, onSearchResults }: CommandPaletteProps) {

  const handleVenue = useCallback((venue: Venue) => {
    onVenueSelect(venue);
    onOpenChange(false);
  }, [onVenueSelect, onOpenChange]);

  /** Show all venues on map as scrollable carousel */
  const handleShowOnMap = useCallback(() => {
    onSearchResults?.(venues);
    onOpenChange(false);
  }, [venues, onSearchResults, onOpenChange]);

  const handleAction = useCallback((action: QuickAction) => {
    onQuickAction?.(action);
    onOpenChange(false);
  }, [onQuickAction, onOpenChange]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="liquid-glass glass-border-glow glass-inner-light rounded-t-[20px] overflow-hidden"
                     style={{ height: '70vh' }}>
        <DrawerTitle className="sr-only">Search</DrawerTitle>
        <Command className="flex flex-col h-full bg-transparent" loop>
          {/* Search input */}
          <div className="px-4 pt-3 pb-2 flex-shrink-0">
            <Command.Input
              placeholder="Search venues, actions..."
              className="w-full bg-[var(--k-surface)] border border-[var(--k-border)] rounded-xl px-4 py-3
                         text-[15px] text-[var(--k-text)] placeholder:text-[var(--k-text-f)] outline-none
                         tracking-[-0.01em]"
              autoFocus
            />
          </div>

          {/* Scrollable results */}
          <Command.List className="flex-1 overflow-y-auto px-4 pb-6">
            <Command.Empty className="py-12 text-center">
              <p className="text-[var(--k-text-m)] text-[15px] font-medium">No results found</p>
              <p className="text-[var(--k-text-f)] text-[13px] mt-1">Try a different search</p>
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading="Quick Actions"
                          className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold
                                     [&_[cmdk-group-heading]]:text-[var(--k-text-f)] [&_[cmdk-group-heading]]:uppercase
                                     [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:px-1
                                     [&_[cmdk-group-heading]]:py-2">
              {QUICK_ACTIONS.map((action) => (
                <Command.Item
                  key={action.id}
                  value={action.label}
                  onSelect={() => handleAction(action.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                             data-[selected=true]:bg-[var(--k-surface-h)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                       style={{ backgroundColor: `${action.color}18` }}>
                    <action.Icon className="w-4 h-4" style={{ color: action.color }} />
                  </div>
                  <span className="text-[14px] font-semibold text-[var(--k-text)] tracking-[-0.01em]">{action.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Show on Map button */}
            {onSearchResults && venues.length > 0 && (
              <div className="px-1 pt-3 pb-1">
                <button
                  onClick={handleShowOnMap}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                             glass-chip text-[12px] font-bold text-[var(--k-accent)] ios-press
                             hover:bg-[var(--k-surface-h)] transition-colors"
                >
                  <Map className="w-3.5 h-3.5" />
                  Show {venues.length} venues on map
                </button>
              </div>
            )}

            {/* Venues */}
            <Command.Group heading="Venues"
                          className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold
                                     [&_[cmdk-group-heading]]:text-[var(--k-text-f)] [&_[cmdk-group-heading]]:uppercase
                                     [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:px-1
                                     [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:mt-2">
              {venues.map((venue) => (
                <Command.Item
                  key={venue.id}
                  value={`${venue.name} ${venue.type}`}
                  onSelect={() => handleVenue(venue)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                             data-[selected=true]:bg-[var(--k-surface-h)] transition-colors"
                >
                  <span className="text-[18px] flex-shrink-0">{venue.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[var(--k-text)] truncate tracking-[-0.01em]">{venue.name}</p>
                    <p className="text-[11px] text-[var(--k-text-m)] truncate">{venue.type} · {venue.dist}</p>
                  </div>
                  <CrowdPill crowd={venue.crowd} pct={venue.pct} />
                </Command.Item>
              ))}
            </Command.Group>

            {/* Categories */}
            <Command.Group heading="Categories"
                          className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold
                                     [&_[cmdk-group-heading]]:text-[var(--k-text-f)] [&_[cmdk-group-heading]]:uppercase
                                     [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:px-1
                                     [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:mt-2">
              {CATEGORIES.map((cat) => (
                <Command.Item
                  key={cat.id}
                  value={cat.label}
                  onSelect={() => handleAction(cat.id as QuickAction)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                             data-[selected=true]:bg-[var(--k-surface-h)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--k-surface)] flex items-center justify-center flex-shrink-0">
                    <cat.Icon className="w-4 h-4 text-[var(--k-text-m)]" />
                  </div>
                  <span className="text-[14px] font-semibold text-[var(--k-text)] tracking-[-0.01em]">{cat.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DrawerContent>
    </Drawer>
  );
}
