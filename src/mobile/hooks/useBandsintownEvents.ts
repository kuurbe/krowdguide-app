import { useState, useEffect, useRef } from 'react';
import type { BandsintownEvent } from '../types';
import { fetchConcerts } from '../services/bandsintown';

export function useBandsintownEvents(cityName: string, state: string) {
  const [events, setEvents] = useState<BandsintownEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Record<string, BandsintownEvent[]>>({});

  useEffect(() => {
    if (!cityName) return;

    const key = `${cityName}-${state}`;
    let cancelled = false;

    if (cache.current[key]) {
      setEvents(cache.current[key]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchConcerts(cityName, state)
      .then((result) => {
        if (cancelled) return;
        cache.current[key] = result.events;
        setEvents(result.events);
        if (result.error) setError(result.error);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load concerts');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [cityName, state]);

  return { events, loading, error };
}
