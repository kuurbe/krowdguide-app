import { useMemo } from 'react';
import type { TicketmasterEvent, BandsintownEvent, UnifiedEvent } from '../types';
import { useTicketmasterEvents } from './useTicketmasterEvents';
import { useBandsintownEvents } from './useBandsintownEvents';

// ── Converters ────────────────────────────────────────────────

function ticketmasterToUnified(tm: TicketmasterEvent): UnifiedEvent {
  const venue = tm._embedded?.venues?.[0];
  const lat = venue?.location?.latitude;
  const lng = venue?.location?.longitude;
  const localDate = tm.dates.start.localDate;
  const localTime = tm.dates.start.localTime ?? '00:00:00';
  const bestImage = tm.images
    .slice()
    .sort((a, b) => b.width - a.width)[0];

  return {
    id: `tm-${tm.id}`,
    name: tm.name,
    datetime: `${localDate}T${localTime}`,
    venueName: venue?.name ?? '',
    coordinates:
      lat && lng ? [parseFloat(lat), parseFloat(lng)] : undefined,
    imageUrl: bestImage?.url,
    url: tm.url,
    source: 'ticketmaster',
    category: tm.classifications?.[0]?.segment?.name,
    artists: undefined,
  };
}

function bandsintownToUnified(bit: BandsintownEvent): UnifiedEvent {
  const lat = parseFloat(bit.venue.latitude);
  const lng = parseFloat(bit.venue.longitude);

  return {
    id: `bit-${bit.id}`,
    name: bit.lineup.length > 0 ? bit.lineup.join(', ') : bit.artistName,
    datetime: bit.datetime,
    venueName: bit.venue.name,
    coordinates: isFinite(lat) && isFinite(lng) ? [lat, lng] : undefined,
    imageUrl: undefined,
    url: bit.url,
    source: 'bandsintown',
    category: 'Music',
    artists: bit.lineup.length > 0 ? bit.lineup : [bit.artistName],
  };
}

// ── Deduplication ─────────────────────────────────────────────

/** Extract YYYY-MM-DD from an ISO-ish datetime string. */
function dateKey(datetime: string): string {
  return datetime.slice(0, 10);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Deduplicate events that share the same venue name (fuzzy) and date.
 * Prefers Ticketmaster entries because they carry richer metadata + images.
 */
function deduplicateEvents(events: UnifiedEvent[]): UnifiedEvent[] {
  const seen = new Map<string, UnifiedEvent>();

  for (const ev of events) {
    const key = `${normalize(ev.venueName)}_${dateKey(ev.datetime)}_${normalize(ev.name)}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, ev);
    } else if (ev.source === 'ticketmaster' && existing.source !== 'ticketmaster') {
      // Prefer Ticketmaster for better images / metadata
      seen.set(key, ev);
    }
  }

  return Array.from(seen.values());
}

// ── Hook ──────────────────────────────────────────────────────

export function useUnifiedEvents(cityName: string, state: string) {
  const tm = useTicketmasterEvents(cityName);
  const bit = useBandsintownEvents(cityName, state);

  const loading = tm.loading || bit.loading;

  const error = tm.error ?? bit.error ?? null;

  const events = useMemo(() => {
    const unified: UnifiedEvent[] = [
      ...tm.events.map(ticketmasterToUnified),
      ...bit.events.map(bandsintownToUnified),
    ];

    const deduped = deduplicateEvents(unified);

    // Sort chronologically
    deduped.sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
    );

    return deduped;
  }, [tm.events, bit.events]);

  return { events, loading, error };
}
