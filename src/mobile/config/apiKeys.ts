/**
 * Centralized API key / config loading from Vite env vars.
 * Pattern: graceful fallback with console.error when missing.
 *
 * Keys that require no API token (NWS, Open-Meteo, GBFS, USGS,
 * Open Charge Map, OSM Overpass, Ookla) are not listed here —
 * they're accessed directly in their service files.
 */

// ── Re-export existing Mapbox token ────────────────────────
export { MAPBOX_TOKEN } from './mapbox';

// ── Free tier keys ─────────────────────────────────────────

export const TICKETMASTER_KEY: string =
  import.meta.env.VITE_TICKETMASTER_API_KEY ?? '';

export const FOURSQUARE_KEY: string =
  import.meta.env.VITE_FOURSQUARE_KEY ?? '';

export const AIRNOW_KEY: string =
  import.meta.env.VITE_AIRNOW_KEY ?? '';

export const BANDSINTOWN_APP_ID: string =
  import.meta.env.VITE_BANDSINTOWN_APP_ID ?? 'krowdguide';

export const NREL_KEY: string =
  import.meta.env.VITE_NREL_AFDC_KEY ?? '';

// ── Growth tier keys (feature-flagged) ─────────────────────

export const BESTTIME_KEY: string =
  import.meta.env.VITE_BESTTIME_KEY ?? '';

export const PREDICTHQ_TOKEN: string =
  import.meta.env.VITE_PREDICTHQ_TOKEN ?? '';

export const TOMORROW_KEY: string =
  import.meta.env.VITE_TOMORROW_KEY ?? '';

export const YELP_KEY: string =
  import.meta.env.VITE_YELP_KEY ?? '';

// ── Feature flags — true when the key is present ───────────

export const HAS_FOURSQUARE = !!import.meta.env.VITE_FOURSQUARE_KEY;
export const HAS_AIRNOW     = !!import.meta.env.VITE_AIRNOW_KEY;
export const HAS_NREL       = !!import.meta.env.VITE_NREL_AFDC_KEY;
export const HAS_BESTTIME   = !!import.meta.env.VITE_BESTTIME_KEY;
export const HAS_PREDICTHQ  = !!import.meta.env.VITE_PREDICTHQ_TOKEN;
export const HAS_TOMORROW   = !!import.meta.env.VITE_TOMORROW_KEY;
export const HAS_YELP       = !!import.meta.env.VITE_YELP_KEY;
