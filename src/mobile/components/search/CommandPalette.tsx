import { useState, useCallback, useEffect, useRef } from 'react';
import { Command } from 'cmdk';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { CrowdPill } from '../shared/CrowdPill';
import { Flame, Volume1, Beer, MapPin, Coffee, UtensilsCrossed, Moon, Trees, Map, Navigation, Loader2 } from 'lucide-react';
import { useAppContext } from '../../context';
import { fetchSuggestions, fetchSearchResult, generateSessionToken } from '../../services/searchBoxService';
import type { SearchSuggestion } from '../../services/searchBoxService';
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
  const { selectedCity, selectPOI, startDirections } = useAppContext();
  const [query, setQuery] = useState('');
  const [poiResults, setPoiResults] = useState<SearchSuggestion[]>([]);
  const [poiLoading, setPoiLoading] = useState(false);
  const sessionToken = useRef(generateSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setPoiResults([]);
      sessionToken.current = generateSessionToken();
    }
  }, [open]);

  // Debounced POI search via Mapbox Search Box
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2) {
      setPoiResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setPoiLoading(true);
      try {
        const results = await fetchSuggestions(
          query,
          selectedCity.coordinates, // [lat, lng] — fetchSuggestions flips internally
          sessionToken.current
        );
        setPoiResults(results);
      } catch {
        setPoiResults([]);
      }
      setPoiLoading(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selectedCity.coordinates]);

  const handleVenue = useCallback((venue: Venue) => {
    onVenueSelect(venue);
    onOpenChange(false);
  }, [onVenueSelect, onOpenChange]);

  const handleShowOnMap = useCallback(() => {
    onSearchResults?.(venues);
    onOpenChange(false);
  }, [venues, onSearchResults, onOpenChange]);

  const handleAction = useCallback((action: QuickAction) => {
    onQuickAction?.(action);
    onOpenChange(false);
  }, [onQuickAction, onOpenChange]);

  // Handle POI selection — retrieve full details then open on map
  const handlePOISelect = useCallback(async (suggestion: SearchSuggestion) => {
    try {
      const result = await fetchSearchResult(suggestion.mapboxId, sessionToken.current);
      if (result) {
        // Open as POI on map
        selectPOI({
          name: result.name,
          group: result.category || 'poi',
          coordinates: [result.coordinates[1], result.coordinates[0]], // [lng, lat] for mapbox
        });
        onOpenChange(false);
      }
    } catch {
      // Fallback — just close
      onOpenChange(false);
    }
  }, [selectPOI, onOpenChange]);

  // Handle directions to POI
  const handlePOIDirections = useCallback(async (e: React.MouseEvent, suggestion: SearchSuggestion) => {
    e.stopPropagation();
    try {
      const result = await fetchSearchResult(suggestion.mapboxId, sessionToken.current);
      if (result) {
        startDirections({ coords: result.coordinates, name: result.name }, 'walking');
        onOpenChange(false);
      }
    } catch {
      onOpenChange(false);
    }
  }, [startDirections, onOpenChange]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="liquid-glass glass-border-glow glass-inner-light rounded-t-[20px] overflow-hidden"
                     style={{ height: '70vh' }}>
        <DrawerTitle className="sr-only">Search</DrawerTitle>
        <Command className="flex flex-col h-full bg-transparent" loop shouldFilter={false}>
          {/* Search input */}
          <div className="px-4 pt-3 pb-2 flex-shrink-0">
            <Command.Input
              placeholder="Search places, venues, actions..."
              value={query}
              onValueChange={setQuery}
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

            {/* POI Results from Mapbox — show when searching */}
            {query.length >= 2 && (poiResults.length > 0 || poiLoading) && (
              <Command.Group heading="Places Nearby"
                            className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold
                                       [&_[cmdk-group-heading]]:text-[var(--k-text-f)] [&_[cmdk-group-heading]]:uppercase
                                       [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:px-1
                                       [&_[cmdk-group-heading]]:py-2">
                {poiLoading && poiResults.length === 0 && (
                  <div className="flex items-center justify-center py-4 gap-2 text-[var(--k-text-m)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[13px]">Searching...</span>
                  </div>
                )}
                {poiResults.map((poi) => (
                  <Command.Item
                    key={poi.mapboxId}
                    value={`poi-${poi.name}-${poi.address || ''}`}
                    onSelect={() => handlePOISelect(poi)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                               data-[selected=true]:bg-[var(--k-surface-h)] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#ff4d6a]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-[#ff4d6a]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--k-text)] truncate">{poi.name}</p>
                      <p className="text-[11px] text-[var(--k-text-m)] truncate">
                        {poi.placeFormatted || poi.address || poi.category || 'Place'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handlePOIDirections(e, poi)}
                      className="w-8 h-8 rounded-lg bg-[#ff4d6a]/10 flex items-center justify-center flex-shrink-0 ios-press"
                      aria-label={`Directions to ${poi.name}`}
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#ff4d6a]" />
                    </button>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Quick Actions — show when not searching */}
            {query.length < 2 && (
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
            )}

            {/* Show on Map */}
            {query.length < 2 && onSearchResults && venues.length > 0 && (
              <div className="px-1 pt-3 pb-1">
                <button
                  onClick={handleShowOnMap}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                             glass-chip text-[12px] font-bold text-[var(--k-accent)] ios-press"
                >
                  <Map className="w-3.5 h-3.5" />
                  Show {venues.length} venues on map
                </button>
              </div>
            )}

            {/* KrowdGuide Venues — always shown, filtered by query */}
            <Command.Group heading="KrowdGuide Venues"
                          className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold
                                     [&_[cmdk-group-heading]]:text-[var(--k-text-f)] [&_[cmdk-group-heading]]:uppercase
                                     [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:px-1
                                     [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:mt-2">
              {venues
                .filter(v => !query || v.name.toLowerCase().includes(query.toLowerCase()) || v.type.toLowerCase().includes(query.toLowerCase()))
                .map((venue) => (
                <Command.Item
                  key={venue.id}
                  value={`${venue.name} ${venue.type}`}
                  onSelect={() => handleVenue(venue)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                             data-[selected=true]:bg-[var(--k-surface-h)] transition-colors"
                >
                  <span className="text-[18px] flex-shrink-0">{venue.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[var(--k-text)] truncate">{venue.name}</p>
                    <p className="text-[11px] text-[var(--k-text-m)] truncate">{venue.type} · {venue.dist}</p>
                  </div>
                  <CrowdPill crowd={venue.crowd} pct={venue.pct} />
                </Command.Item>
              ))}
            </Command.Group>

            {/* Categories — show when not searching */}
            {query.length < 2 && (
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
                    <span className="text-[14px] font-semibold text-[var(--k-text)]">{cat.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DrawerContent>
    </Drawer>
  );
}
