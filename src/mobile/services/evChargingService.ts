/**
 * EV Charging Station data — Open Charge Map + NREL AFDC.
 * Both APIs are free. NREL needs an API key; Open Charge Map does not.
 */

import { fetchJSON, buildURL, errorMessage } from './fetchUtil';
import { NREL_KEY, HAS_NREL } from '../config/apiKeys';
import type { EVStation, LatLng } from '../types';

// ── Open Charge Map (no key needed) ────────────────────────

const OCM_BASE = 'https://api.openchargemap.io/v3/poi/';

interface OCMResult {
  ID: number;
  AddressInfo: {
    Title: string;
    Latitude: number;
    Longitude: number;
    AddressLine1?: string;
    Town?: string;
    StateOrProvince?: string;
  };
  OperatorInfo?: { Title?: string };
  Connections?: Array<{
    ConnectionType?: { Title?: string };
    Quantity?: number;
  }>;
  UsageCost?: string;
  NumberOfPoints?: number;
}

async function fetchOCM(lat: number, lng: number, radius = 5): Promise<EVStation[]> {
  try {
    const url = buildURL(OCM_BASE, {
      output: 'json',
      latitude: lat,
      longitude: lng,
      distance: radius,
      distanceunit: 'Miles',
      maxresults: 50,
      compact: 'true',
      verbose: 'false',
    });
    const data = await fetchJSON<OCMResult[]>(url, { timeout: 10_000 });
    return data.map(r => ({
      id: `ocm-${r.ID}`,
      name: r.AddressInfo.Title,
      coordinates: [r.AddressInfo.Latitude, r.AddressInfo.Longitude] as LatLng,
      address: [r.AddressInfo.AddressLine1, r.AddressInfo.Town, r.AddressInfo.StateOrProvince]
        .filter(Boolean).join(', '),
      network: r.OperatorInfo?.Title ?? undefined,
      connectorTypes: (r.Connections ?? [])
        .map(c => c.ConnectionType?.Title)
        .filter((t): t is string => !!t),
      numPorts: r.NumberOfPoints ?? (r.Connections ?? []).reduce((s, c) => s + (c.Quantity ?? 1), 0),
      isFree: r.UsageCost?.toLowerCase().includes('free') ?? false,
      source: 'ocm' as const,
    }));
  } catch (err) {
    if (import.meta.env.DEV) console.error('[OCM]', errorMessage(err));
    return [];
  }
}

// ── NREL AFDC (needs API key) ──────────────────────────────

const NREL_BASE = 'https://developer.nrel.gov/api/alt-fuel-stations/v1.json';

interface NRELResult {
  alt_fuel_station: Array<{
    id: number;
    station_name: string;
    latitude: number;
    longitude: number;
    street_address: string;
    city: string;
    state: string;
    ev_network?: string;
    ev_connector_types?: string[];
    ev_level2_evse_num?: number;
    ev_dc_fast_num?: number;
    access_code?: string;
  }>;
}

async function fetchNREL(lat: number, lng: number, radius = 5): Promise<EVStation[]> {
  if (!HAS_NREL) return [];
  try {
    const url = buildURL(NREL_BASE, {
      fuel_type: 'ELEC',
      latitude: lat,
      longitude: lng,
      radius: radius,
      limit: 50,
      api_key: NREL_KEY,
    });
    const data = await fetchJSON<NRELResult>(url, { timeout: 10_000 });
    return (data.alt_fuel_station ?? []).map(s => ({
      id: `nrel-${s.id}`,
      name: s.station_name,
      coordinates: [s.latitude, s.longitude] as LatLng,
      address: `${s.street_address}, ${s.city}, ${s.state}`,
      network: s.ev_network ?? undefined,
      connectorTypes: s.ev_connector_types ?? [],
      numPorts: (s.ev_level2_evse_num ?? 0) + (s.ev_dc_fast_num ?? 0),
      isFree: s.access_code === 'public',
      source: 'nrel' as const,
    }));
  } catch (err) {
    if (import.meta.env.DEV) console.error('[NREL]', errorMessage(err));
    return [];
  }
}

// ── Combined ───────────────────────────────────────────────

/** Fetch EV charging stations from Open Charge Map + NREL AFDC, deduped */
export async function fetchEVStations(lat: number, lng: number): Promise<EVStation[]> {
  const [ocm, nrel] = await Promise.allSettled([fetchOCM(lat, lng), fetchNREL(lat, lng)]);

  const stations: EVStation[] = [];
  if (ocm.status === 'fulfilled') stations.push(...ocm.value);
  if (nrel.status === 'fulfilled') stations.push(...nrel.value);

  // Deduplicate by proximity (within ~50m)
  const seen = new Set<string>();
  return stations.filter(s => {
    const key = `${s.coordinates[0].toFixed(4)},${s.coordinates[1].toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
