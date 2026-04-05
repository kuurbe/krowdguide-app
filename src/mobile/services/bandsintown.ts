/**
 * Bandsintown Events API service.
 * Fetches upcoming concerts/events by city + state.
 */
import type { BandsintownEvent } from '../types';
import { BANDSINTOWN_APP_ID } from '../config/apiKeys';
import { fetchWithRetry, errorMessage } from './fetchUtil';

const BASE_URL = 'https://rest.bandsintown.com/artists';

export interface FetchConcertsResult {
  events: BandsintownEvent[];
  error: string | null;
}

/**
 * Fetch upcoming concerts for a city/state via Bandsintown.
 *
 * Strategy: query events for a curated list of high-touring artists
 * and filter to those whose venue matches the requested city.
 * Bandsintown has no official "events by city" endpoint on v3,
 * so we fan out across popular artists and merge results.
 */
export async function fetchConcerts(
  city: string,
  state: string,
): Promise<FetchConcertsResult> {
  const cityLower = city.toLowerCase();

  // High-touring artists likely to have upcoming dates in most US cities
  const seedArtists = [
    'Drake', 'Taylor Swift', 'Bad Bunny', 'The Weeknd', 'Morgan Wallen',
    'Beyoncé', 'Kendrick Lamar', 'SZA', 'Billie Eilish', 'Post Malone',
    'Luke Combs', 'Dua Lipa', 'Olivia Rodrigo', 'Zach Bryan', 'Tyler Childers',
  ];

  const allEvents: BandsintownEvent[] = [];
  const seen = new Set<string>();

  // Fan out requests (limited concurrency to stay polite)
  const batchSize = 5;
  for (let i = 0; i < seedArtists.length; i += batchSize) {
    const batch = seedArtists.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((artist) => fetchArtistEvents(artist)),
    );

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      for (const ev of result.value) {
        // Match city (case-insensitive) and optionally state
        const venueCity = ev.venue.city.toLowerCase();
        const venueRegion = ev.venue.region.toLowerCase();
        if (
          venueCity === cityLower &&
          (!state || venueRegion === state.toLowerCase())
        ) {
          if (!seen.has(ev.id)) {
            seen.add(ev.id);
            allEvents.push(ev);
          }
        }
      }
    }
  }

  // Sort chronologically
  allEvents.sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  );

  return { events: allEvents, error: null };
}

/** Fetch upcoming events for a single artist. Returns [] on failure. */
async function fetchArtistEvents(artist: string): Promise<BandsintownEvent[]> {
  const encoded = encodeURIComponent(artist);
  const url = `${BASE_URL}/${encoded}/events?app_id=${BANDSINTOWN_APP_ID}&date=upcoming`;

  try {
    const res = await fetchWithRetry(url, { timeout: 6000, retries: 1 });
    const data: unknown = await res.json();

    if (!Array.isArray(data)) return [];

    return (data as RawBITEvent[]).map((raw) => ({
      id: String(raw.id),
      artistName: raw.artist?.name ?? artist,
      url: raw.url ?? '',
      datetime: raw.datetime ?? '',
      venue: {
        name: raw.venue?.name ?? '',
        city: raw.venue?.city ?? '',
        region: raw.venue?.region ?? '',
        country: raw.venue?.country ?? '',
        latitude: String(raw.venue?.latitude ?? ''),
        longitude: String(raw.venue?.longitude ?? ''),
      },
      lineup: Array.isArray(raw.lineup) ? raw.lineup : [],
      description: raw.description ?? undefined,
      offers: Array.isArray(raw.offers) ? raw.offers : undefined,
    }));
  } catch {
    // Graceful per-artist failure — don't break the full fan-out
    return [];
  }
}

// ── Internal raw API shape ────────────────────────────────────
interface RawBITEvent {
  id: string | number;
  url?: string;
  datetime?: string;
  artist?: { name?: string };
  venue?: {
    name?: string;
    city?: string;
    region?: string;
    country?: string;
    latitude?: string | number;
    longitude?: string | number;
  };
  lineup?: string[];
  description?: string;
  offers?: Array<{ type: string; url: string; status: string }>;
}
