/**
 * BestTime.app — Real-time venue busyness data.
 * GROWTH TIER: Feature-flagged via VITE_BESTTIME_KEY.
 * Returns null when key is not configured.
 */

import { fetchJSON, errorMessage } from './fetchUtil';
import { BESTTIME_KEY, HAS_BESTTIME } from '../config/apiKeys';
import type { BusynessData } from '../types';

const BASE = 'https://besttime.app/api/v1';

interface BestTimeResponse {
  status: string;
  analysis?: {
    day_raw?: number[];
    peak_hours?: Array<{ peak_start: number; peak_end: number }>;
    quiet_hours?: Array<{ quiet_start: number; quiet_end: number }>;
    busy_hours?: Array<{ busy_start: number; busy_end: number }>;
  };
  venue_info?: {
    venue_name: string;
  };
}

interface BestTimeLiveResponse {
  status: string;
  analysis?: {
    venue_live_busyness?: number; // 0-100
  };
}

/**
 * Fetch predicted busyness + optional live data for a venue.
 * Returns null if BestTime key is not configured or on error.
 */
export async function fetchBusyness(
  venueName: string,
  venueAddress: string,
): Promise<BusynessData | null> {
  if (!HAS_BESTTIME) return null;

  try {
    // Fetch forecast
    const forecastUrl = `${BASE}/forecasts?api_key_private=${BESTTIME_KEY}&venue_name=${encodeURIComponent(venueName)}&venue_address=${encodeURIComponent(venueAddress)}`;
    const forecast = await fetchJSON<BestTimeResponse>(forecastUrl, { timeout: 15_000 });

    if (forecast.status !== 'OK' || !forecast.analysis) return null;

    const dayRaw = forecast.analysis.day_raw ?? new Array(24).fill(0);
    const peakHours = (forecast.analysis.peak_hours ?? []).map(p => p.peak_start);
    const quietHours = (forecast.analysis.quiet_hours ?? []).map(q => q.quiet_start);

    // Try to get live busyness (may not be available for all venues)
    let livePercentage: number | undefined;
    try {
      const liveUrl = `${BASE}/forecasts/live?api_key_private=${BESTTIME_KEY}&venue_name=${encodeURIComponent(venueName)}&venue_address=${encodeURIComponent(venueAddress)}`;
      const live = await fetchJSON<BestTimeLiveResponse>(liveUrl, { timeout: 8_000 });
      if (live.status === 'OK' && live.analysis?.venue_live_busyness != null) {
        livePercentage = live.analysis.venue_live_busyness;
      }
    } catch {
      // Live data not available — continue without it
    }

    return {
      venueName: forecast.venue_info?.venue_name ?? venueName,
      dayRaw,
      livePercentage,
      peakHours,
      quietHours,
      source: 'besttime',
      fetchedAt: Date.now(),
    };
  } catch (err) {
    if (import.meta.env.DEV) console.error('[BestTime]', errorMessage(err));
    return null;
  }
}
