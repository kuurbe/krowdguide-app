/**
 * Foursquare Places API v3 service.
 * Search nearby venues, fetch details + photos.
 * Respects monthly quota via localStorage tracking.
 */
import type { FoursquareVenue, LatLng } from '../types';
import { FOURSQUARE_KEY, HAS_FOURSQUARE } from '../config/apiKeys';
import { fetchWithRetry, buildURL, errorMessage } from './fetchUtil';

const BASE = 'https://api.foursquare.com/v3/places';

const FSQ_HEADERS: Record<string, string> = {
  Authorization: FOURSQUARE_KEY,
  Accept: 'application/json',
};

// ── Rate-limit tracking ───────────────────────────────────────

const STORAGE_KEY = 'kg_fsq_calls';
const MONTHLY_LIMIT = 9500; // leave buffer below 10 000

interface CallCounter {
  count: number;
  resetMonth: string;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getCounter(): CallCounter {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CallCounter;
      if (parsed.resetMonth === currentMonth()) return parsed;
    }
  } catch { /* corrupted — reset */ }
  return { count: 0, resetMonth: currentMonth() };
}

function incrementCounter(): void {
  const counter = getCounter();
  counter.count += 1;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counter));
  } catch { /* quota exceeded — non-critical */ }
}

function isOverQuota(): boolean {
  const counter = getCounter();
  if (counter.count >= MONTHLY_LIMIT) {
    if (import.meta.env.DEV) {
      console.warn(`[Foursquare] Monthly quota reached (${counter.count}/${MONTHLY_LIMIT})`);
    }
    return true;
  }
  return false;
}

// ── Public API ────────────────────────────────────────────────

/**
 * Search for Foursquare places near a location.
 * Returns [] if no key configured or quota exceeded.
 */
export async function searchFoursquarePlaces(
  lat: number,
  lng: number,
  query?: string,
): Promise<FoursquareVenue[]> {
  if (!HAS_FOURSQUARE || isOverQuota()) return [];

  const url = buildURL(`${BASE}/search`, {
    ll: `${lat},${lng}`,
    radius: '1000',
    limit: '50',
    query,
  });

  try {
    incrementCounter();
    const res = await fetchWithRetry(url, { headers: FSQ_HEADERS });
    const data = (await res.json()) as { results?: RawFSQPlace[] };

    if (!Array.isArray(data.results)) return [];
    return data.results.map(r => mapPlace(r));
  } catch (err) {
    if (import.meta.env.DEV) console.error('[Foursquare]', errorMessage(err));
    return [];
  }
}

/**
 * Fetch full details for a single Foursquare place.
 * Returns null if no key, quota exceeded, or request fails.
 */
export async function getFoursquareDetails(
  fsqId: string,
): Promise<FoursquareVenue | null> {
  if (!HAS_FOURSQUARE || isOverQuota()) return null;

  const fields = [
    'name', 'geocodes', 'location', 'categories', 'hours',
    'rating', 'price', 'website', 'tips', 'photos',
  ].join(',');

  const url = `${BASE}/${fsqId}?fields=${fields}`;

  try {
    incrementCounter();
    const res = await fetchWithRetry(url, { headers: FSQ_HEADERS });
    const raw = (await res.json()) as RawFSQPlace;
    return mapPlace(raw, fsqId);
  } catch (err) {
    if (import.meta.env.DEV) console.error('[Foursquare]', errorMessage(err));
    return null;
  }
}

// ── Mapping helpers ───────────────────────────────────────────

function mapPlace(raw: RawFSQPlace, fallbackId?: string): FoursquareVenue {
  const lat = raw.geocodes?.main?.latitude ?? 0;
  const lng = raw.geocodes?.main?.longitude ?? 0;

  return {
    fsqId: raw.fsq_id ?? fallbackId ?? '',
    name: raw.name ?? '',
    categories: (raw.categories ?? []).map((c) => ({
      name: c.name ?? '',
      icon: {
        prefix: c.icon?.prefix ?? '',
        suffix: c.icon?.suffix ?? '',
      },
    })),
    coordinates: [lat, lng] as LatLng,
    address: raw.location?.formatted_address,
    hours: raw.hours
      ? { display: raw.hours.display ?? '', isOpen: raw.hours.open_now ?? false }
      : undefined,
    rating: raw.rating,
    photos: (raw.photos ?? []).map(
      (p) => `${p.prefix}300x300${p.suffix}`,
    ),
    tips: (raw.tips ?? []).map((t) => ({
      text: t.text ?? '',
      createdAt: t.created_at ?? '',
    })),
    price: raw.price,
    website: raw.website,
  };
}

// ── Raw API types (internal) ──────────────────────────────────

interface RawFSQPlace {
  fsq_id?: string;
  name?: string;
  geocodes?: { main?: { latitude: number; longitude: number } };
  location?: { formatted_address?: string };
  categories?: Array<{
    name?: string;
    icon?: { prefix?: string; suffix?: string };
  }>;
  hours?: { display?: string; open_now?: boolean };
  rating?: number;
  price?: number;
  website?: string;
  photos?: Array<{ prefix: string; suffix: string }>;
  tips?: Array<{ text?: string; created_at?: string }>;
}
