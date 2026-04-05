/**
 * Tomorrow.io — Minute-by-minute precipitation forecast.
 * GROWTH TIER: Feature-flagged via VITE_TOMORROW_KEY.
 * Returns empty array when key is not configured.
 */

import { fetchJSON, errorMessage } from './fetchUtil';
import { TOMORROW_KEY, HAS_TOMORROW } from '../config/apiKeys';
import type { MinuteWeather } from '../types';

const BASE = 'https://api.tomorrow.io/v4/timelines';

interface TomorrowResponse {
  data: {
    timelines: Array<{
      intervals: Array<{
        startTime: string;
        values: {
          precipitationIntensity: number;
          precipitationType: number;
          temperature?: number;
        };
      }>;
    }>;
  };
}

// Tomorrow.io precipitation type codes
const PRECIP_MAP: Record<number, MinuteWeather['precipitationType']> = {
  0: 'none',
  1: 'rain',
  2: 'snow',
  3: 'ice',
  4: 'ice',
};

/**
 * Fetch minute-by-minute precipitation for the next 60 minutes.
 * Returns empty array if Tomorrow.io key is not configured.
 */
export async function fetchMinuteByMinute(
  lat: number,
  lng: number,
): Promise<MinuteWeather[]> {
  if (!HAS_TOMORROW) return [];

  try {
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      fields: 'precipitationIntensity,precipitationType,temperature',
      timesteps: '1m',
      units: 'imperial',
      apikey: TOMORROW_KEY,
    });

    const data = await fetchJSON<TomorrowResponse>(`${BASE}?${params}`, {
      timeout: 10_000,
    });

    const intervals = data.data?.timelines?.[0]?.intervals ?? [];

    return intervals.map(i => ({
      timestamp: i.startTime,
      precipitationIntensity: i.values.precipitationIntensity,
      precipitationType: PRECIP_MAP[i.values.precipitationType] ?? 'none',
      temperature: i.values.temperature,
    }));
  } catch (err) {
    if (import.meta.env.DEV) console.error('[Tomorrow.io]', errorMessage(err));
    return [];
  }
}

/**
 * Check if rain is coming in the next N minutes.
 * Convenience helper for alert generation.
 */
export function willRainSoon(forecast: MinuteWeather[], withinMinutes = 15): {
  willRain: boolean;
  minutesUntilRain: number | null;
  type: MinuteWeather['precipitationType'];
} {
  const upcoming = forecast.slice(0, withinMinutes);
  const rainIdx = upcoming.findIndex(m => m.precipitationIntensity > 0.1);

  if (rainIdx === -1) {
    return { willRain: false, minutesUntilRain: null, type: 'none' };
  }

  return {
    willRain: true,
    minutesUntilRain: rainIdx,
    type: upcoming[rainIdx].precipitationType,
  };
}
