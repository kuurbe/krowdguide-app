import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CrowdPill } from '../shared/CrowdPill';
import { Flame, Volume1, Beer, MapPin, Coffee, UtensilsCrossed, Moon, Trees, Map, Navigation, Loader2, Search } from 'lucide-react';
import { useAppContext } from '../../context';
import { MAPBOX_TOKEN } from '../../config/mapbox';
import { fetchSearchResult, generateSessionToken } from '../../services/searchBoxService';
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
  // Debug removed — search confirmed working
  const sessionToken = useRef(generateSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset + focus on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setPoiResults([]);
      sessionToken.current = generateSessionToken();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Debounced POI search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2) { setPoiResults([]); setPoiLoading(false); return; }

    setPoiLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const [lat, lng] = selectedCity.coordinates;
        if (!MAPBOX_TOKEN) { setPoiLoading(false); return; }
        const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${MAPBOX_TOKEN}&proximity=${lng},${lat}&limit=5&language=en&country=US&types=poi&session_token=${sessionToken.current}`;
        const res = await fetch(url);
        const data = await res.json();
        const results = (data.suggestions ?? []).map((s: any) => ({
          name: s.name,
          mapboxId: s.mapbox_id,
          address: s.address,
          fullAddress: s.full_address,
          placeFormatted: s.place_formatted,
          category: s.poi_category?.[0],
          maki: s.maki,
        }));
        setPoiResults(results);
      } catch {
        setPoiResults([]);
      }
      setPoiLoading(false);
    }, 250);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selectedCity]);

  // Filter KrowdGuide venues by query
  const filteredVenues = query.length >= 1
    ? venues.filter(v => v.name.toLowerCase().includes(query.toLowerCase()) || v.type.toLowerCase().includes(query.toLowerCase()))
    : venues;

  const handleVenue = useCallback((venue: Venue) => {
    onVenueSelect(venue);
    onOpenChange(false);
  }, [onVenueSelect, onOpenChange]);

  const handleAction = useCallback((action: QuickAction) => {
    onQuickAction?.(action);
    onOpenChange(false);
  }, [onQuickAction, onOpenChange]);

  const handlePOISelect = useCallback(async (suggestion: SearchSuggestion) => {
    try {
      const result = await fetchSearchResult(suggestion.mapboxId, sessionToken.current);
      if (result) {
        selectPOI({ name: result.name, group: result.category || 'poi', coordinates: [result.coordinates[1], result.coordinates[0]] });
      }
    } catch { /* silent */ }
    onOpenChange(false);
  }, [selectPOI, onOpenChange]);

  const handlePOIDirections = useCallback(async (e: React.MouseEvent, suggestion: SearchSuggestion) => {
    e.stopPropagation();
    try {
      const result = await fetchSearchResult(suggestion.mapboxId, sessionToken.current);
      if (result) startDirections({ coords: result.coordinates, name: result.name }, 'walking');
    } catch { /* silent */ }
    onOpenChange(false);
  }, [startDirections, onOpenChange]);

  const isSearching = query.length >= 2;
  const hasResults = poiResults.length > 0 || filteredVenues.length > 0;

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={() => onOpenChange(false)} />

      {/* Panel */}
      <div className="absolute bottom-0 left-0 right-0 h-[75vh] bg-[var(--k-bg)] rounded-t-[20px] flex flex-col overflow-hidden"
           style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.5)' }}>

        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
          <div className="w-8 h-1 rounded-full bg-[var(--k-text-f)]/30" />
        </div>

        {/* Search input */}
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-[var(--k-surface)] border border-[var(--k-border)] rounded-xl px-4 py-3">
            <Search className="w-4 h-4 text-[var(--k-text-f)] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search places, venues..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[15px] text-[var(--k-text)] placeholder:text-[var(--k-text-f)] outline-none"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-[var(--k-text-f)] text-[12px] font-bold">Clear</button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">

          {/* POI results from Mapbox */}
          {isSearching && (
            <div className="mb-3">
              <p className="text-[10px] font-bold text-[var(--k-text-f)] uppercase tracking-[0.08em] px-1 py-2">Places Nearby</p>
              {poiLoading && poiResults.length === 0 && (
                <div className="flex items-center justify-center py-4 gap-2 text-[var(--k-text-m)]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[13px]">Searching...</span>
                </div>
              )}
              {poiResults.map((poi) => (
                <button
                  key={poi.mapboxId}
                  onClick={() => handlePOISelect(poi)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--k-surface-h)] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#ff4d6a]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-[#ff4d6a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[var(--k-text)] truncate">{poi.name}</p>
                    <p className="text-[11px] text-[var(--k-text-m)] truncate">{poi.placeFormatted || poi.address || poi.category || 'Place'}</p>
                  </div>
                  <button
                    onClick={(e) => handlePOIDirections(e, poi)}
                    className="w-8 h-8 rounded-lg bg-[#ff4d6a]/10 flex items-center justify-center flex-shrink-0 ios-press"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#ff4d6a]" />
                  </button>
                </button>
              ))}
              {!poiLoading && poiResults.length === 0 && (
                <p className="text-[13px] text-[var(--k-text-f)] px-3 py-2">No places found for "{query}"</p>
              )}
            </div>
          )}

          {/* KrowdGuide venues */}
          {filteredVenues.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold text-[var(--k-text-f)] uppercase tracking-[0.08em] px-1 py-2">KrowdGuide Venues</p>
              {filteredVenues.slice(0, 10).map((venue) => (
                <button
                  key={venue.id}
                  onClick={() => handleVenue(venue)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--k-surface-h)] transition-colors text-left"
                >
                  <span className="text-[18px] flex-shrink-0">{venue.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[var(--k-text)] truncate">{venue.name}</p>
                    <p className="text-[11px] text-[var(--k-text-m)] truncate">{venue.type} · {venue.dist}</p>
                  </div>
                  <CrowdPill crowd={venue.crowd} pct={venue.pct} />
                </button>
              ))}
            </div>
          )}

          {/* Quick actions — show when not searching */}
          {!isSearching && (
            <>
              <p className="text-[10px] font-bold text-[var(--k-text-f)] uppercase tracking-[0.08em] px-1 py-2">Quick Actions</p>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--k-surface-h)] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${action.color}18` }}>
                    <action.Icon className="w-4 h-4" style={{ color: action.color }} />
                  </div>
                  <span className="text-[14px] font-semibold text-[var(--k-text)]">{action.label}</span>
                </button>
              ))}

              {onSearchResults && venues.length > 0 && (
                <button
                  onClick={() => { onSearchResults(venues); onOpenChange(false); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 mt-3 rounded-xl glass-chip text-[12px] font-bold text-[var(--k-accent)] ios-press"
                >
                  <Map className="w-3.5 h-3.5" />
                  Show {venues.length} venues on map
                </button>
              )}

              <p className="text-[10px] font-bold text-[var(--k-text-f)] uppercase tracking-[0.08em] px-1 py-2 mt-2">Categories</p>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleAction(cat.id as QuickAction)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--k-surface-h)] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--k-surface)] flex items-center justify-center flex-shrink-0">
                    <cat.Icon className="w-4 h-4 text-[var(--k-text-m)]" />
                  </div>
                  <span className="text-[14px] font-semibold text-[var(--k-text)]">{cat.label}</span>
                </button>
              ))}
            </>
          )}

          {/* No results at all */}
          {isSearching && !poiLoading && !hasResults && (
            <div className="py-12 text-center">
              <p className="text-[var(--k-text-m)] text-[15px] font-medium">No results found</p>
              <p className="text-[var(--k-text-f)] text-[13px] mt-1">Try a different search</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
