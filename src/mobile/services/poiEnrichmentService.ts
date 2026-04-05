/**
 * POI Enrichment Service — multi-source pipeline for business details.
 * Combines FREE sources (Overpass/OSM, Mapbox Search Box) with optional
 * paid sources (Foursquare) for hours, phone, website, photos, rating.
 *
 * Priority: Overpass (free, richest tags) → Mapbox Search Box (free with token) → Foursquare (paid)
 */

import { MAPBOX_TOKEN } from '../config/mapbox';
import { HAS_FOURSQUARE } from '../config/apiKeys';
import { searchFoursquarePlaces, getFoursquareDetails } from './foursquareService';
import { fetchJSON, buildURL } from './fetchUtil';

// ── Enriched POI type ───────────────────────────────────────

export interface EnrichedPOI {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: { display: string; isOpen: boolean };
  rating?: number;         // 0-10 scale
  photos?: string[];
  category?: string;
  price?: number;          // 1-4
  source: 'osm' | 'mapbox' | 'foursquare' | 'combined';
}

// ── Main enrichment function ────────────────────────────────

/**
 * Enrich a POI with details from multiple free sources.
 * @param name   Business name
 * @param lng    Longitude
 * @param lat    Latitude
 * @returns      Enriched data or null if nothing found
 */
export async function enrichPOI(
  name: string,
  lng: number,
  lat: number,
): Promise<EnrichedPOI | null> {
  // Fire all sources in parallel — first to return useful data wins
  const [osmResult, mapboxResult, fsqResult] = await Promise.allSettled([
    fetchOSMDetails(name, lat, lng),
    fetchMapboxDetails(name, lat, lng),
    HAS_FOURSQUARE ? fetchFSQDetails(name, lat, lng) : Promise.resolve(null),
  ]);

  const osm = osmResult.status === 'fulfilled' ? osmResult.value : null;
  const mapbox = mapboxResult.status === 'fulfilled' ? mapboxResult.value : null;
  const fsq = fsqResult.status === 'fulfilled' ? fsqResult.value : null;

  // Nothing found at all
  if (!osm && !mapbox && !fsq) return null;

  // Merge — prefer richer sources, fill gaps from others
  const merged: EnrichedPOI = {
    name,
    source: 'combined',
    // Address: Mapbox > OSM > Foursquare
    address: mapbox?.address || osm?.address || fsq?.address,
    // Phone: OSM > Foursquare (Mapbox doesn't provide phone)
    phone: osm?.phone || fsq?.phone,
    // Website: OSM > Foursquare
    website: osm?.website || fsq?.website,
    // Hours: OSM > Foursquare
    hours: osm?.hours || fsq?.hours,
    // Rating: Foursquare only (OSM doesn't have ratings)
    rating: fsq?.rating,
    // Photos: Foursquare only (OSM doesn't have photos)
    photos: fsq?.photos,
    // Category: Mapbox > OSM > Foursquare
    category: mapbox?.category || osm?.category || fsq?.category,
    // Price: Foursquare only
    price: fsq?.price,
  };

  return merged;
}

// ── Source 1: OpenStreetMap via Overpass (FREE, no key) ──────

async function fetchOSMDetails(
  name: string,
  lat: number,
  lng: number,
): Promise<EnrichedPOI | null> {
  // Use first significant word for broader matching (e.g. "Bonanza Inn" → "Bonanza")
  // Remove common suffixes that OSM may not include
  const words = name.replace(/['']/g, '').split(/\s+/).filter(w => w.length > 2);
  const searchTerm = words.length > 1 ? words[0] : name;
  const escapedName = searchTerm.replace(/[\\'"]/g, '.');
  // Search within 500m — Mapbox and OSM coords can differ slightly
  const query = `[out:json][timeout:8];
(
  nwr(around:500,${lat},${lng})["name"~"${escapedName}",i];
);
out body 3;`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = (await res.json()) as { elements?: Array<{ tags?: Record<string, string> }> };
    if (!data.elements?.length) return null;

    // Pick the best match — prefer the one whose name most closely matches
    const normalizedName = name.toLowerCase();
    const bestEl = data.elements
      .filter(el => el.tags?.name)
      .sort((a, b) => {
        const aName = (a.tags?.name || '').toLowerCase();
        const bName = (b.tags?.name || '').toLowerCase();
        // Exact match first, then includes, then anything
        const aScore = aName === normalizedName ? 3 : aName.includes(normalizedName) || normalizedName.includes(aName) ? 2 : 1;
        const bScore = bName === normalizedName ? 3 : bName.includes(normalizedName) || normalizedName.includes(bName) ? 2 : 1;
        // Also prefer elements with richer tags
        const aRich = Object.keys(a.tags || {}).length;
        const bRich = Object.keys(b.tags || {}).length;
        return (bScore * 100 + bRich) - (aScore * 100 + aRich);
      })[0];

    if (!bestEl?.tags) return null;
    const tags = bestEl.tags;

    // Parse opening_hours to determine if open now
    let hours: EnrichedPOI['hours'] | undefined;
    if (tags.opening_hours) {
      const isOpen = isCurrentlyOpen(tags.opening_hours);
      hours = { display: tags.opening_hours, isOpen };
    }

    // Build address from addr:* tags
    const addrParts = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:city'],
      tags['addr:state'],
    ].filter(Boolean);

    return {
      name: tags.name || name,
      address: addrParts.length > 0 ? addrParts.join(' ') : undefined,
      phone: tags.phone || tags['contact:phone'],
      website: tags.website || tags['contact:website'],
      hours,
      category: tags.cuisine || tags.shop || tags.amenity || tags.tourism,
      source: 'osm',
    };
  } catch {
    return null;
  }
}

/**
 * Simple heuristic to check if a business is currently open.
 * Handles common OSM opening_hours formats like:
 * "Mo-Fr 08:00-22:00; Sa 09:00-21:00; Su 10:00-20:00"
 * "24/7"
 * Falls back to undefined (unknown) for complex formats.
 */
function isCurrentlyOpen(hoursStr: string): boolean {
  if (hoursStr === '24/7') return true;

  const now = new Date();
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const today = dayNames[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Split by semicolons for multiple rules
  const rules = hoursStr.split(';').map(r => r.trim());

  for (const rule of rules) {
    // Match patterns like "Mo-Fr 08:00-22:00" or "Sa 09:00-21:00"
    const match = rule.match(/^([A-Za-z, -]+)\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
    if (!match) continue;

    const dayRange = match[1];
    const openMin = parseInt(match[2]) * 60 + parseInt(match[3]);
    const closeMin = parseInt(match[4]) * 60 + parseInt(match[5]);

    // Check if today falls within the day range
    if (dayRangeIncludes(dayRange, today)) {
      return currentMinutes >= openMin && currentMinutes < closeMin;
    }
  }

  // Can't determine — assume open during business hours
  return currentMinutes >= 480 && currentMinutes < 1260; // 8am-9pm
}

function dayRangeIncludes(range: string, day: string): boolean {
  const dayOrder = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const dayIdx = dayOrder.indexOf(day);
  if (dayIdx < 0) return false;

  // Handle comma-separated days: "Mo,We,Fr"
  const parts = range.split(',').map(p => p.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      // Range like "Mo-Fr"
      const [start, end] = part.split('-').map(d => d.trim());
      const startIdx = dayOrder.indexOf(start);
      const endIdx = dayOrder.indexOf(end);
      if (startIdx >= 0 && endIdx >= 0) {
        if (startIdx <= endIdx) {
          if (dayIdx >= startIdx && dayIdx <= endIdx) return true;
        } else {
          // Wrapping range like "Fr-Mo"
          if (dayIdx >= startIdx || dayIdx <= endIdx) return true;
        }
      }
    } else {
      // Single day like "Sa"
      if (dayOrder.indexOf(part) === dayIdx) return true;
    }
  }
  return false;
}

// ── Source 2: Mapbox Search Box retrieve (FREE with token) ──

async function fetchMapboxDetails(
  name: string,
  lat: number,
  lng: number,
): Promise<EnrichedPOI | null> {
  try {
    // Use Mapbox Search Box suggest → retrieve for address + category
    const sessionToken = crypto.randomUUID();
    const suggestUrl = buildURL('https://api.mapbox.com/search/searchbox/v1/suggest', {
      q: name,
      access_token: MAPBOX_TOKEN,
      session_token: sessionToken,
      proximity: `${lng},${lat}`,
      limit: '3',
      language: 'en',
      types: 'poi',
      country: 'US',
      bbox: `${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}`, // constrain to ~2km box
    });

    const suggestData = await fetchJSON<{
      suggestions: Array<{
        name: string;
        mapbox_id: string;
        full_address?: string;
        address?: string;
        poi_category?: string[];
        context?: Array<{ text: string }>;
      }>;
    }>(suggestUrl);

    const suggestion = suggestData.suggestions?.[0];
    if (!suggestion) return null;

    // Retrieve full details
    const retrieveUrl = buildURL(
      `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}`,
      { access_token: MAPBOX_TOKEN, session_token: sessionToken },
    );

    const retrieveData = await fetchJSON<{
      features: Array<{
        properties: {
          name: string;
          full_address?: string;
          address?: string;
          poi_category?: string[];
          brand?: string[];
          external_ids?: Record<string, string>;
          metadata?: Record<string, any>;
        };
      }>;
    }>(retrieveUrl);

    const feature = retrieveData.features?.[0];
    if (!feature) return null;

    const category = feature.properties.poi_category?.[0]
      || feature.properties.brand?.[0];

    return {
      name: feature.properties.name || name,
      address: feature.properties.full_address || feature.properties.address,
      category,
      source: 'mapbox',
    };
  } catch {
    return null;
  }
}

// ── Source 3: Foursquare (PAID, optional) ────────────────────

async function fetchFSQDetails(
  name: string,
  lat: number,
  lng: number,
): Promise<EnrichedPOI | null> {
  try {
    const results = await searchFoursquarePlaces(lat, lng, name);
    if (results.length === 0) return null;

    // Find best match by name
    const normalized = name.toLowerCase();
    const match = results.find(r => r.name.toLowerCase().includes(normalized) || normalized.includes(r.name.toLowerCase()))
      || results[0];

    const details = await getFoursquareDetails(match.fsqId);
    if (!details) return null;

    return {
      name: details.name,
      address: details.address,
      phone: undefined, // Foursquare v3 doesn't return phone in basic fields
      website: details.website,
      hours: details.hours,
      rating: details.rating,
      photos: details.photos,
      category: details.categories?.[0]?.name,
      price: details.price,
      source: 'foursquare',
    };
  } catch {
    return null;
  }
}
