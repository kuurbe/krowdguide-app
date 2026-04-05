/**
 * PredictHQ — Event demand intelligence.
 * GROWTH TIER: Feature-flagged via VITE_PREDICTHQ_TOKEN.
 * Returns empty array when token is not configured.
 */

import { fetchWithRetry, errorMessage } from './fetchUtil';
import { PREDICTHQ_TOKEN, HAS_PREDICTHQ } from '../config/apiKeys';
import type { PredictHQEvent, LatLng } from '../types';

const BASE = 'https://api.predicthq.com/v1/events/';

interface PHQResponse {
  results: Array<{
    id: string;
    title: string;
    category: string;
    rank: number;
    start: string;
    end?: string;
    location: [number, number]; // [lng, lat]
    labels: string[];
  }>;
}

/**
 * Fetch high-impact events near a location.
 * Returns empty array if PredictHQ token is not configured.
 */
export async function fetchEventDemand(
  lat: number,
  lng: number,
  radiusKm = 5,
  limit = 20,
): Promise<PredictHQEvent[]> {
  if (!HAS_PREDICTHQ) return [];

  try {
    const params = new URLSearchParams({
      'location_around.origin': `${lat},${lng}`,
      'location_around.offset': `${radiusKm}km`,
      sort: 'rank',
      limit: String(limit),
      'rank.gte': '30', // Only notable events
    });

    const res = await fetchWithRetry(`${BASE}?${params}`, {
      timeout: 10_000,
      headers: {
        Authorization: `Bearer ${PREDICTHQ_TOKEN}`,
        Accept: 'application/json',
      },
    });

    const data: PHQResponse = await res.json();

    return (data.results ?? []).map(e => ({
      id: e.id,
      title: e.title,
      category: e.category,
      rank: e.rank,
      localStart: e.start,
      localEnd: e.end,
      coordinates: [e.location[1], e.location[0]] as LatLng, // [lng,lat] → [lat,lng]
      labels: e.labels,
    }));
  } catch (err) {
    if (import.meta.env.DEV) console.error('[PredictHQ]', errorMessage(err));
    return [];
  }
}
