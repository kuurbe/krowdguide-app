import { useState, useEffect, useCallback, useRef } from 'react';
import type { OraclePulse, Venue } from '../types';

// Use HTTPS or skip on production (mixed content blocked)
const ORACLE_URL = typeof window !== 'undefined' && window.location.protocol === 'https:'
  ? '' // Disabled on HTTPS — Oracle endpoint is HTTP only
  : 'http://149.28.196.99:8001/pulse_data.json';
const POLL_INTERVAL = 30_000; // 30s
const MAX_RETRIES = 2;

/** Map Oracle vibe_score → app crowd level */
function vibeToCrowd(vibe: string): 'quiet' | 'moderate' | 'busy' {
  const v = vibe.toLowerCase();
  if (v === 'dead' || v === 'quiet' || v === 'calm') return 'quiet';
  if (v === 'busy' || v === 'packed' || v === 'crowded') return 'busy';
  return 'moderate';
}

/** Map Oracle pulse → app Venue (for Reno/Sparks pilot) */
function pulseToVenue(pulse: OraclePulse): Venue {
  return {
    id: 'oracle-1',
    name: pulse.venue,
    icon: '📡',
    type: `Live · ${pulse.metrics.safety_status}`,
    crowd: vibeToCrowd(pulse.metrics.vibe_score),
    pct: pulse.metrics.occupancy_pct,
    dist: '0.1 mi',
    image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400',
    coordinates: [39.5349, -119.7527],
  };
}

export function usePulseData() {
  const [pulse, setPulse] = useState<OraclePulse | null>(null);
  const [liveVenue, setLiveVenue] = useState<Venue | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const retriesRef = useRef(0);

  const fetchPulse = useCallback(async () => {
    // Skip if no URL (HTTPS deployment can't reach HTTP oracle)
    if (!ORACLE_URL) return;
    // Cancel any in-flight request before starting a new one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Timeout via AbortController (Safari-compatible — no AbortSignal.timeout)
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(ORACLE_URL, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Double-check abort wasn't called during fetch
      if (controller.signal.aborted) return;

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: OraclePulse = await res.json();

      // Basic response validation
      if (!data?.venue || data?.metrics?.occupancy_pct == null) {
        throw new Error('Invalid Oracle response schema');
      }

      setPulse(data);
      setLiveVenue(pulseToVenue(data));
      setIsLive(true);
      setError(null);
      retriesRef.current = 0;

      if (import.meta.env.DEV) {
        console.log('[Oracle] Live feed:', data.venue, data.metrics.occupancy_pct + '%');
      }
    } catch (err) {
      // Ignore abort errors — expected during cleanup
      if (err instanceof DOMException && err.name === 'AbortError') return;

      setIsLive(false);
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);

      // Retry with backoff (max 2 retries)
      if (retriesRef.current < MAX_RETRIES) {
        retriesRef.current += 1;
        const delay = 1000 * Math.pow(2, retriesRef.current);
        setTimeout(() => {
          if (!controller.signal.aborted) fetchPulse();
        }, delay);
      }
    }
  }, []);

  useEffect(() => {
    fetchPulse();
    intervalRef.current = setInterval(fetchPulse, POLL_INTERVAL);

    return () => {
      // Clean up: cancel in-flight request + stop polling
      abortRef.current?.abort();
      clearInterval(intervalRef.current);
    };
  }, [fetchPulse]);

  return { pulse, liveVenue, isLive, error, refetch: fetchPulse };
}
