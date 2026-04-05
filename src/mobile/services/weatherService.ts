/**
 * Weather service — NWS (primary) with Open-Meteo fallback.
 * Both APIs are free and require no API key.
 */

import type { WeatherData, WeatherIcon } from '../types';
import { fetchJSON, errorMessage } from './fetchUtil';

// ── NWS Types ────────────────────────────────────────────

interface NWSPointsResponse {
  properties: {
    forecast: string;
  };
}

interface NWSForecastPeriod {
  temperature: number;
  temperatureUnit: 'F' | 'C';
  shortForecast: string;
  windSpeed: string;
  isDaytime: boolean;
  relativeHumidity?: { value: number };
}

interface NWSForecastResponse {
  properties: {
    periods: NWSForecastPeriod[];
  };
}

// ── Open-Meteo Types ─────────────────────────────────────

interface OpenMeteoResponse {
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
  };
}

// ── Shared Headers ───────────────────────────────────────

const NWS_HEADERS: Record<string, string> = {
  'User-Agent': 'KrowdGuide/1.0 (krowdguide@example.com)',
};

// ── Icon Mapping ─────────────────────────────────────────

/** Map NWS shortForecast text to a WeatherIcon via keyword matching */
function nwsForecastToIcon(forecast: string): WeatherIcon {
  const f = forecast.toLowerCase();
  if (f.includes('thunder') || f.includes('lightning')) return 'cloud-lightning';
  if (f.includes('snow') || f.includes('sleet') || f.includes('ice') || f.includes('flurr')) return 'cloud-snow';
  if (f.includes('rain') || f.includes('shower') || f.includes('drizzle')) return 'cloud-rain';
  if (f.includes('fog') || f.includes('mist') || f.includes('haze')) return 'cloud-fog';
  if (f.includes('wind')) return 'wind';
  if (f.includes('partly') || f.includes('mostly sunny')) return 'cloud-sun';
  if (f.includes('cloud') || f.includes('overcast')) return 'cloud';
  if (f.includes('sun') || f.includes('clear') || f.includes('fair')) return 'sun';
  return 'cloud-sun';
}

/** Map WMO weather code (Open-Meteo) to WeatherIcon */
function wmoCodeToIcon(code: number): WeatherIcon {
  if (code <= 1) return 'sun';
  if (code === 2) return 'cloud-sun';
  if (code === 3) return 'cloud';
  if (code >= 45 && code <= 48) return 'cloud-fog';
  if (code >= 51 && code <= 67) return 'cloud-rain';
  if (code >= 71 && code <= 77) return 'cloud-snow';
  if (code >= 80 && code <= 82) return 'cloud-rain';
  if (code >= 95 && code <= 99) return 'cloud-lightning';
  return 'cloud';
}

/** Map WMO weather code to a human-readable description */
function wmoCodeToDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 56 && code <= 57) return 'Freezing drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 66 && code <= 67) return 'Freezing rain';
  if (code >= 71 && code <= 75) return 'Snowfall';
  if (code >= 77 && code <= 77) return 'Snow grains';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

// ── Conversion Helpers ───────────────────────────────────

function fToC(f: number): number {
  return Math.round(((f - 32) * 5) / 9);
}

// ── NWS Fetch (Primary) ──────────────────────────────────

async function fetchNWS(lat: number, lng: number): Promise<WeatherData> {
  // Step 1: resolve forecast endpoint from coordinates
  const pointsURL = `https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`;
  const points = await fetchJSON<NWSPointsResponse>(pointsURL, {
    headers: NWS_HEADERS,
    timeout: 6000,
  });

  const forecastURL = points.properties.forecast;

  // Step 2: fetch current forecast period
  const forecast = await fetchJSON<NWSForecastResponse>(forecastURL, {
    headers: NWS_HEADERS,
    timeout: 6000,
  });

  const period = forecast.properties.periods[0];
  const tempF = period.temperatureUnit === 'F'
    ? period.temperature
    : Math.round(period.temperature * 9 / 5 + 32);

  return {
    temperature: tempF,
    temperatureC: fToC(tempF),
    description: period.shortForecast,
    icon: nwsForecastToIcon(period.shortForecast),
    windSpeed: period.windSpeed,
    humidity: period.relativeHumidity?.value,
    source: 'nws',
    fetchedAt: Date.now(),
  };
}

// ── Open-Meteo Fetch (Fallback) ──────────────────────────

async function fetchOpenMeteo(lat: number, lng: number): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    `&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph`;

  const data = await fetchJSON<OpenMeteoResponse>(url, { timeout: 6000 });
  const cw = data.current_weather;

  return {
    temperature: Math.round(cw.temperature),
    temperatureC: fToC(Math.round(cw.temperature)),
    description: wmoCodeToDescription(cw.weathercode),
    icon: wmoCodeToIcon(cw.weathercode),
    windSpeed: `${Math.round(cw.windspeed)} mph`,
    source: 'open-meteo',
    fetchedAt: Date.now(),
  };
}

// ── Public API ───────────────────────────────────────────

/**
 * Fetch current weather for given coordinates.
 * Tries NWS first (US only), falls back to Open-Meteo (global).
 * Returns null if both sources fail.
 */
export async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    return await fetchNWS(lat, lng);
  } catch (nwsErr) {
    if (import.meta.env.DEV) {
      console.warn('[Weather] NWS failed, trying Open-Meteo:', errorMessage(nwsErr));
    }
  }

  try {
    return await fetchOpenMeteo(lat, lng);
  } catch (omErr) {
    if (import.meta.env.DEV) {
      console.error('[Weather] Open-Meteo also failed:', errorMessage(omErr));
    }
    return null;
  }
}
