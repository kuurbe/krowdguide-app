/**
 * Air Quality (AirNow EPA) + Seismic Alerts (USGS) services.
 * AirNow requires an API key; USGS is free with no key.
 */

import type { AQIData, SeismicAlert } from '../types';
import { AIRNOW_KEY, HAS_AIRNOW } from '../config/apiKeys';
import { fetchJSON, buildURL, errorMessage } from './fetchUtil';

// ── AirNow Types ─────────────────────────────────────────

interface AirNowObservation {
  AQI: number;
  Category: { Name: string; Number: number };
  ParameterName: string;
}

// ── USGS Types ───────────────────────────────────────────

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
  };
}

interface USGSResponse {
  features: USGSFeature[];
}

// ── AQI Color Mapping ────────────────────────────────────

function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#22c55e';   // green  — Good
  if (aqi <= 100) return '#eab308';  // yellow — Moderate
  if (aqi <= 150) return '#f97316';  // orange — USG
  if (aqi <= 200) return '#ef4444';  // red    — Unhealthy
  if (aqi <= 300) return '#a855f7';  // purple — Very Unhealthy
  return '#991b1b';                   // maroon — Hazardous
}

// ── Public API: AQI ──────────────────────────────────────

/**
 * Fetch current Air Quality Index from AirNow EPA.
 * Returns null if no API key is configured or the request fails.
 */
export async function fetchAQI(lat: number, lng: number): Promise<AQIData | null> {
  if (!HAS_AIRNOW) return null;

  try {
    const url = buildURL(
      'https://www.airnowapi.org/aq/observation/latLong/current/',
      {
        format: 'application/json',
        latitude: lat.toFixed(4),
        longitude: lng.toFixed(4),
        distance: '25',
        API_KEY: AIRNOW_KEY,
      },
    );

    const observations = await fetchJSON<AirNowObservation[]>(url, { timeout: 8000 });

    if (!observations.length) return null;

    // Pick the observation with the highest AQI (worst pollutant)
    const worst = observations.reduce((a, b) => (b.AQI > a.AQI ? b : a));

    return {
      aqi: worst.AQI,
      category: worst.Category.Name,
      pollutant: worst.ParameterName,
      color: aqiColor(worst.AQI),
      source: 'airnow',
      fetchedAt: Date.now(),
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[AQI] AirNow fetch failed:', errorMessage(err));
    }
    return null;
  }
}

// ── Public API: Earthquakes ──────────────────────────────

/**
 * Fetch recent earthquakes (M3+) within 100 km of coordinates from USGS.
 * Returns an empty array on failure.
 */
export async function fetchRecentQuakes(lat: number, lng: number): Promise<SeismicAlert[]> {
  try {
    const url = buildURL(
      'https://earthquake.usgs.gov/fdsnws/event/1/query',
      {
        format: 'geojson',
        latitude: lat.toFixed(4),
        longitude: lng.toFixed(4),
        maxradiuskm: '100',
        minmagnitude: '3',
        limit: '5',
        orderby: 'time',
      },
    );

    const data = await fetchJSON<USGSResponse>(url, { timeout: 8000 });

    return data.features.map((f): SeismicAlert => ({
      id: f.id,
      magnitude: f.properties.mag,
      place: f.properties.place,
      time: f.properties.time,
      url: f.properties.url,
    }));
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[Seismic] USGS fetch failed:', errorMessage(err));
    }
    return [];
  }
}
