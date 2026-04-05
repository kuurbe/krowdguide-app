/**
 * React hook for nearby transit stops + live arrivals.
 * Polls every 30 seconds and manages abort cleanup.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TransitStop, TransitArrival } from '../types';
import { fetchNearbyStops, fetchArrivals } from '../services/transitService';
import { errorMessage } from '../services/fetchUtil';

const POLL_INTERVAL = 30_000; // 30s

interface UseTransitResult {
  stops: TransitStop[];
  arrivals: Map<string, TransitArrival[]>;
  loading: boolean;
  error: string | null;
}

export function useTransit(
  coordinates: [number, number] | null,
  cityId: string,
): UseTransitResult {
  const [stops, setStops] = useState<TransitStop[]>([]);
  const [arrivals, setArrivals] = useState<Map<string, TransitArrival[]>>(new Map());
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
      const nearbyStops = await fetchNearbyStops(
        coordinates[0],
        coordinates[1],
        cityId,
      );

      if (controller.signal.aborted) return;
      setStops(nearbyStops);

      // Fetch arrivals for each stop in parallel
      const arrivalEntries = await Promise.all(
        nearbyStops.map(async (stop) => {
          const arr = await fetchArrivals(stop.id, cityId);
          return [stop.id, arr] as const;
        }),
      );

      if (controller.signal.aborted) return;
      setArrivals(new Map(arrivalEntries));
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(errorMessage(err));
    } finally {
      if (!controller.signal.aborted) {
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

  return { stops, arrivals, loading, error };
}
