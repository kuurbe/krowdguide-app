/**
 * Mapbox Search Box API v1 — autocomplete suggestions + place retrieval.
 * Uses the two-step suggest → retrieve flow with session tokens for billing.
 */

import { MAPBOX_TOKEN } from '../config/mapbox';
import { fetchJSON, buildURL } from './fetchUtil';

// ── Types ────────────────────────────────────────────────

export interface SearchSuggestion {
  name: string;
  mapboxId: string;
  address?: string;
  fullAddress?: string;
  placeFormatted?: string;
  category?: string;
  maki?: string; // icon name
}

export interface SearchResult {
  name: string;
  coordinates: [number, number]; // [lat, lng] — converted from API's [lng, lat]
  address?: string;
  fullAddress?: string;
  category?: string;
}

// ── Raw API response shapes ──────────────────────────────

interface SuggestResponse {
  suggestions: Array<{
    name: string;
    mapbox_id: string;
    address?: string;
    full_address?: string;
    place_formatted?: string;
    poi_category?: string[];
    maki?: string;
  }>;
}

interface RetrieveResponse {
  features: Array<{
    properties: {
      name: string;
      address?: string;
      full_address?: string;
      poi_category?: string[];
    };
    geometry: {
      coordinates: [number, number]; // [lng, lat]
    };
  }>;
}

// ── Public API ───────────────────────────────────────────

const SUGGEST_BASE = 'https://api.mapbox.com/search/searchbox/v1/suggest';
const RETRIEVE_BASE = 'https://api.mapbox.com/search/searchbox/v1/retrieve';

/** Generate a unique session token for Mapbox Search billing. */
export function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Fetch autocomplete suggestions for a query string.
 *
 * @param query         Search text
 * @param proximity     [lat, lng] — flipped to [lng, lat] for the API
 * @param sessionToken  Token from generateSessionToken()
 * @returns             Array of suggestions
 */
export async function fetchSuggestions(
  query: string,
  proximity: [number, number],
  sessionToken: string,
): Promise<SearchSuggestion[]> {
  if (!query.trim()) return [];

  const [lat, lng] = proximity;

  const url = buildURL(SUGGEST_BASE, {
    q: query,
    access_token: MAPBOX_TOKEN,
    session_token: sessionToken,
    proximity: `${lng},${lat}`,
    limit: 8,
    language: 'en',
    country: 'US',
    types: 'poi',
  });

  const data = await fetchJSON<SuggestResponse>(url);

  return (data.suggestions ?? []).map((s) => ({
    name: s.name,
    mapboxId: s.mapbox_id,
    address: s.address,
    fullAddress: s.full_address,
    placeFormatted: s.place_formatted,
    category: s.poi_category?.[0],
    maki: s.maki,
  }));
}

/**
 * Retrieve full place details by Mapbox ID.
 *
 * @param mapboxId      ID from a suggestion
 * @param sessionToken  Same session token used for the suggest call
 * @returns             SearchResult with coordinates, or null if not found
 */
export async function fetchSearchResult(
  mapboxId: string,
  sessionToken: string,
): Promise<SearchResult | null> {
  const url = buildURL(`${RETRIEVE_BASE}/${mapboxId}`, {
    access_token: MAPBOX_TOKEN,
    session_token: sessionToken,
  });

  const data = await fetchJSON<RetrieveResponse>(url);

  const feature = data.features?.[0];
  if (!feature) return null;

  const [lng, lat] = feature.geometry.coordinates;

  return {
    name: feature.properties.name,
    coordinates: [lat, lng], // convert to [lat, lng]
    address: feature.properties.address,
    fullAddress: feature.properties.full_address,
    category: feature.properties.poi_category?.[0],
  };
}
