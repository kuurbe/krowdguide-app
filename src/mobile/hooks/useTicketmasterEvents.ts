import { useState, useEffect, useRef } from 'react';
import type { TicketmasterEvent } from '../types';
import { fetchEvents } from '../services/ticketmaster';

export function useTicketmasterEvents(cityName: string) {
  const [events, setEvents] = useState<TicketmasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Record<string, TicketmasterEvent[]>>({});

  useEffect(() => {
    let cancelled = false;

    if (cache.current[cityName]) {
      setEvents(cache.current[cityName]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchEvents(cityName, { size: 20 })
      .then((result) => {
        if (cancelled) return;
        cache.current[cityName] = result.events;
        setEvents(result.events);
        if (result.error) setError(result.error);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load events');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [cityName]);

  return { events, loading, error };
}
