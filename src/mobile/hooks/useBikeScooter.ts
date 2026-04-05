/**
 * React hook for nearby bike/scooter stations via GBFS.
 * Polls every 60 seconds and filters to stations within 1 km of user.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { BikeStation } from '../types';
import { fetchBikeStations } from '../services/gbfsService';
import { haversineKm } from '../services/transitService';
import { errorMessage } from '../services/fetchUtil';

const POLL_INTERVAL = 60_000; // 60s
const PROXIMITY_KM = 1;

interface UseBikeScooterResult {
  stations: BikeStation[];
  loading: boolean;
  error: string | null;
}

export function useBikeScooter(
  coordinates: [number, number] | null,
  cityId: string,
): UseBikeScooterResult {
  const [stations, setStations] = useState<BikeStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const refresh = useCallback(async () => {
    if (!coordinates) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const allStations = await fetchBikeStations(cityId, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      const nearby = allStations.filter(
        (s) => haversineKm(coordinates, s.coordinates) <= PROXIMITY_KM,
      );

      setStations(nearby);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(errorMessage(err));
    } finally {
      if (!abortRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [coordinates, cityId]);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL);

    return () => {
      abortRef.current?.abort();
      clearInterval(intervalRef.current);
    };
  }, [refresh]);

  return { stations, loading, error };
}
