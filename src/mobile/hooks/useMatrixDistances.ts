/**
 * React hook for Mapbox Matrix distances — calculates walk times
 * from user location to a list of venues. Skips re-fetch if the
 * user has moved less than 100 m since the last calculation.
 */

import { useState, useEffect, useRef } from 'react';
import { fetchWalkTimes } from '../services/matrixService';
import { errorMessage } from '../services/fetchUtil';
import type { MatrixResult } from '../types';

interface VenueCoord {
  id: string;
  coordinates: [number, number]; // [lat, lng]
}

interface MatrixState {
  distances: Map<string, { walkSeconds: number; walkMeters: number }>;
  loading: boolean;
  error: string | null;
}

// ── Haversine helper (meters) ────────────────────────────

const R = 6_371_000; // Earth radius in meters

function haversineMeters(
  a: [number, number],
  b: [number, number],
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// ── Minimum movement threshold (meters) ──────────────────

const MOVE_THRESHOLD = 100;

// ── Hook ─────────────────────────────────────────────────

export function useMatrixDistances(
  venues: VenueCoord[],
  userLocation: [number, number] | null,
) {
  const [state, setState] = useState<MatrixState>({
    distances: new Map(),
    loading: false,
    error: null,
  });

  const lastLocation = useRef<[number, number] | null>(null);
  const lastVenueIds = useRef<string>('');

  useEffect(() => {
    if (!userLocation || venues.length === 0) return;

    // Build a stable venue-ID string to detect venue list changes
    const venueKey = venues.map((v) => v.id).join(',');

    // Skip if location hasn't moved enough AND venues are the same
    if (
      lastLocation.current &&
      lastVenueIds.current === venueKey &&
      haversineMeters(lastLocation.current, userLocation) < MOVE_THRESHOLD
    ) {
      return;
    }

    let cancelled = false;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchWalkTimes(userLocation, venues)
      .then((results: MatrixResult[]) => {
        if (cancelled) return;

        const map = new Map<string, { walkSeconds: number; walkMeters: number }>();
        for (const r of results) {
          map.set(r.venueId, {
            walkSeconds: r.walkSeconds,
            walkMeters: r.walkMeters,
          });
        }

        lastLocation.current = userLocation;
        lastVenueIds.current = venueKey;

        setState({ distances: map, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error: errorMessage(err) }));
      });

    return () => {
      cancelled = true;
    };
  }, [userLocation, venues]);

  return {
    distances: state.distances,
    loading: state.loading,
    error: state.error,
  };
}
