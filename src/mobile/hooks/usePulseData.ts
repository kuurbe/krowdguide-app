import { useState, useEffect, useCallback, useRef } from 'react';
import type { OraclePulse, Venue } from '../types';

const ORACLE_URL = 'http://149.28.196.99:8001/pulse_data.json';
const POLL_INTERVAL = 30_000; // 30s

/** Map Oracle vibe_score → app crowd level */
function vibeToCrowd(vibe: string): 'quiet' | 'moderate' | 'busy' {
  const v = vibe.toLowerCase();
  if (v === 'dead' || v === 'quiet' || v === 'calm') return 'quiet';
  if (v === 'busy' || v === 'packed' || v === 'crowded') return 'busy';
  return 'moderate'; // lively, moderate, etc.
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
    coordinates: [39.5349, -119.7527], // Victorian Square, Sparks NV
  };
}

export function usePulseData() {
  const [pulse, setPulse] = useState<OraclePulse | null>(null);
  const [liveVenue, setLiveVenue] = useState<Venue | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchPulse = useCallback(async () => {
    try {
      const res = await fetch(ORACLE_URL, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: OraclePulse = await res.json();
      setPulse(data);
      setLiveVenue(pulseToVenue(data));
      setIsLive(true);
      setError(null);
      console.log('[Oracle] Live feed:', data.venue, data.metrics.occupancy_pct + '%');
    } catch (err) {
      setIsLive(false);
      setError(err instanceof Error ? err.message : 'Connection failed');
      // Keep last known data if we had it
    }
  }, []);

  useEffect(() => {
    fetchPulse();
    intervalRef.current = setInterval(fetchPulse, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchPulse]);

  return { pulse, liveVenue, isLive, error, refetch: fetchPulse };
}
