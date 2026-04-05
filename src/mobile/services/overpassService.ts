/**
 * OSM Overpass API service.
 * Query nearby points-of-interest by amenity type.
 * No API key required — public endpoint.
 */
import { errorMessage } from './fetchUtil';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export interface OverpassPOI {
  id: number;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  amenityType: string;
  tags: Record<string, string>;
}

/**
 * Query nearby POIs from OpenStreetMap via Overpass.
 * Returns [] on error or empty results.
 */
export async function queryNearbyPOIs(
  lat: number,
  lng: number,
  amenityType: string,
  radius: number = 1000,
): Promise<OverpassPOI[]> {
  const query = [
    `[out:json][timeout:10];`,
    `node(around:${radius},${lat},${lng})[amenity=${amenityType}];`,
    `out body;`,
  ].join('\n');

  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      throw new Error(`Overpass API error: ${res.status}`);
    }

    const data = (await res.json()) as { elements?: RawElement[] };

    if (!Array.isArray(data.elements)) return [];

    return data.elements
      .filter((el) => el.tags?.name)
      .map((el) => ({
        id: el.id,
        name: el.tags!.name!,
        coordinates: [el.lat, el.lon] as [number, number],
        amenityType: el.tags?.amenity ?? amenityType,
        tags: el.tags ?? {},
      }));
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[Overpass]', errorMessage(err));
    }
    return [];
  }
}

// ── Internal raw type ─────────────────────────────────────────

interface RawElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}
