import { useState, useEffect, useRef } from 'react';
import type { TicketmasterEvent } from '../types';
import { fetchEvents } from '../services/ticketmaster';

export function useTicketmasterEvents(cityName: string) {
  const [events, setEvents] = useState<TicketmasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cache = useRef<Record<string, TicketmasterEvent[]>>({});

  useEffect(() => {
    if (cache.current[cityName]) {
      setEvents(cache.current[cityName]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchEvents(cityName, { size: 20 })
      .then((data) => {
        cache.current[cityName] = data;
        setEvents(data);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [cityName]);

  return { events, loading, error };
}
