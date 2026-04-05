/**
 * Combined hook for weather, air quality, and seismic data.
 * Polls every 15 minutes with AbortController cleanup.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WeatherData, AQIData, SeismicAlert } from '../types';
import { fetchWeather } from '../services/weatherService';
import { fetchAQI, fetchRecentQuakes } from '../services/aqiService';

const POLL_INTERVAL = 900_000; // 15 minutes

/** Threshold in degrees — skip refetch if coordinates barely moved */
const COORD_DRIFT_THRESHOLD = 0.01;

interface UseWeatherResult {
  weather: WeatherData | null;
  aqi: AQIData | null;
  quakes: SeismicAlert[];
  loading: boolean;
  error: string | null;
}

export function useWeather(coordinates: [number, number] | null): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aqi, setAqi] = useState<AQIData | null>(null);
  const [quakes, setQuakes] = useState<SeismicAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const lastCoordsRef = useRef<[number, number] | null>(null);

  /** True if new coords are close enough to cached coords to skip refetch */
  function coordsMatch(
    a: [number, number] | null,
    b: [number, number] | null,
  ): boolean {
    if (!a || !b) return false;
    return (
      Math.abs(a[0] - b[0]) < COORD_DRIFT_THRESHOLD &&
      Math.abs(a[1] - b[1]) < COORD_DRIFT_THRESHOLD
    );
  }

  const fetchAll = useCallback(async (coords: [number, number], force = false) => {
    // Skip if coordinates haven't meaningfully changed (unless forced)
    if (!force && coordsMatch(coords, lastCoordsRef.current) && weather) {
      return;
    }

    // Cancel any in-flight requests
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const [lat, lng] = coords;
    let cancelled = false;

    // Check abort status after each async call
    const checkAborted = (): boolean => {
      if (controller.signal.aborted) {
        cancelled = true;
        return true;
      }
      return false;
    };

    try {
      // Fire all three requests in parallel
      const [weatherResult, aqiResult, quakeResult] = await Promise.all([
        fetchWeather(lat, lng),
        fetchAQI(lat, lng),
        fetchRecentQuakes(lat, lng),
      ]);

      if (checkAborted()) return;

      setWeather(weatherResult);
      setAqi(aqiResult);
      setQuakes(quakeResult);
      lastCoordsRef.current = coords;

      if (!weatherResult) {
        setError('Weather data unavailable');
      }
    } catch (err) {
      if (cancelled || controller.signal.aborted) return;
      // Ignore abort errors
      if (err instanceof DOMException && err.name === 'AbortError') return;

      const message = err instanceof Error ? err.message : 'Failed to fetch environment data';
      setError(message);
    } finally {
      if (!cancelled && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [weather]);

  useEffect(() => {
    // Clear polling when coordinates become null
    if (!coordinates) {
      clearInterval(intervalRef.current);
      return;
    }

    // Initial fetch (force = true to bypass drift check on mount)
    fetchAll(coordinates, true);

    // Set up polling
    intervalRef.current = setInterval(() => {
      fetchAll(coordinates, true);
    }, POLL_INTERVAL);

    return () => {
      abortRef.current?.abort();
      clearInterval(intervalRef.current);
    };
  }, [coordinates?.[0], coordinates?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  return { weather, aqi, quakes, loading, error };
}
