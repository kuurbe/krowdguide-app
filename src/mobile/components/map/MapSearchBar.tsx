import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useAppContext } from '../../context';
import { CrowdPill } from '../shared/CrowdPill';
import type { Venue } from '../../types';

export function MapSearchBar({
  venues = [],
  onVenueSelect,
}: {
  venues?: Venue[];
  onVenueSelect?: (venue: Venue) => void;
}) {
  const { selectedCity } = useAppContext();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return venues
      .filter(v => v.name.toLowerCase().includes(q) || v.type.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query, venues]);

  const showDropdown = focused && results.length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (venue: Venue) => {
    setQuery('');
    setFocused(false);
    onVenueSelect?.(venue);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="absolute top-4 left-4 right-4 z-[1010]">
      <div
        className="flex items-center gap-2.5 py-[12px] pl-4 pr-4 rounded-[20px]
                    bg-[var(--k-elevated)] ios-blur-thick
                    border border-[var(--k-border)]
                    shadow-[var(--k-search-shadow)]"
      >
        <Search className="w-[17px] h-[17px] text-[var(--k-text-m)] flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={`Search ${selectedCity.name}...`}
          className="flex-1 bg-transparent text-[15px] text-[var(--k-text)] placeholder:text-[var(--k-text-f)] outline-none
                     tracking-[-0.01em]"
        />
        {query && (
          <button
            onClick={handleClear}
            className="w-6 h-6 rounded-full bg-[var(--k-fill)] flex items-center justify-center flex-shrink-0"
          >
            <X className="w-3 h-3 text-[var(--k-text-m)]" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {showDropdown && (
        <div className="mt-2 rounded-2xl bg-[var(--k-elevated)] ios-blur-thick border border-[var(--k-border)]
                        shadow-[var(--k-modal-shadow)] overflow-hidden search-dropdown">
          {results.map((venue) => (
            <button
              key={venue.id}
              onClick={() => handleSelect(venue)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left
                         hover:bg-[var(--k-surface-h)] active:bg-[var(--k-surface-h)] transition-colors
                         border-b border-[var(--k-border-s)] last:border-b-0"
            >
              <span className="text-[18px] flex-shrink-0">{venue.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[var(--k-text)] truncate tracking-[-0.01em]">{venue.name}</p>
                <p className="text-[11px] text-[var(--k-text-m)] truncate">{venue.type} · {venue.dist}</p>
              </div>
              <CrowdPill crowd={venue.crowd} pct={venue.pct} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
