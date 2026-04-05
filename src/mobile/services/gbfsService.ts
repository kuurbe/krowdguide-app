/**
 * GBFS (General Bikeshare Feed Specification) service.
 * Fetches station info + status from public GBFS JSON endpoints and
 * merges them into BikeStation[].
 *
 * Add new cities by extending GBFS_FEEDS with the system's base URL.
 */

import type { BikeStation } from '../types';
import { fetchJSON, errorMessage } from './fetchUtil';

/* ------------------------------------------------------------------ */
/*  GBFS feed configuration per city                                  */
/* ------------------------------------------------------------------ */

interface GBFSCityConfig {
  /** Base URL for the GBFS system (without trailing slash) */
  baseUrl: string;
  /** Operator display name */
  operator: string;
}

/**
 * Known GBFS feeds by city ID.
 * Dallas: Dallas Bikeshare operated by Lyft.
 * Reno: Placeholder — no public GBFS system confirmed yet.
 */
const GBFS_FEEDS: Record<string, GBFSCityConfig> = {
  dallas: {
    baseUrl: 'https://gbfs.lyft.com/gbfs/2.3/dal/en',
    operator: 'Dallas Bikeshare',
  },
  // reno: { baseUrl: '...', operator: 'Reno Bikeshare' },
};

/* ------------------------------------------------------------------ */
/*  GBFS JSON response shapes                                        */
/* ------------------------------------------------------------------ */

interface GBFSStationInfo {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
  capacity?: number;
}

interface GBFSStationStatus {
  station_id: string;
  num_bikes_available: number;
  num_ebikes_available?: number;
  num_docks_available: number;
  is_renting: boolean | number;
}

interface GBFSStationInfoResponse {
  data: { stations: GBFSStationInfo[] };
}

interface GBFSStationStatusResponse {
  data: { stations: GBFSStationStatus[] };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Fetch bike/scooter stations for a city by merging GBFS
 * station_information + station_status feeds.
 *
 * Returns an empty array if no GBFS feed is configured for the city.
 */
export async function fetchBikeStations(
  cityId: string,
  opts?: { signal?: AbortSignal },
): Promise<BikeStation[]> {
  const config = GBFS_FEEDS[cityId];
  if (!config) return [];

  try {
    const [infoRes, statusRes] = await Promise.all([
      fetchJSON<GBFSStationInfoResponse>(
        `${config.baseUrl}/station_information.json`,
        { signal: opts?.signal },
      ),
      fetchJSON<GBFSStationStatusResponse>(
        `${config.baseUrl}/station_status.json`,
        { signal: opts?.signal },
      ),
    ]);

    const statusMap = new Map<string, GBFSStationStatus>();
    for (const s of statusRes.data.stations) {
      statusMap.set(s.station_id, s);
    }

    return infoRes.data.stations.map((info): BikeStation => {
      const status = statusMap.get(info.station_id);
      return {
        id: info.station_id,
        name: info.name,
        coordinates: [info.lat, info.lon],
        bikesAvailable: status?.num_bikes_available ?? 0,
        ebikesAvailable: status?.num_ebikes_available ?? 0,
        docksAvailable: status?.num_docks_available ?? 0,
        isRenting: status ? Boolean(status.is_renting) : false,
        operator: config.operator,
      };
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[gbfsService] Failed for ${cityId}:`, errorMessage(err));
    }
    return [];
  }
}
