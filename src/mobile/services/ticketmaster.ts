import type { TicketmasterEvent } from '../types';

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

export async function fetchEvents(
  city: string,
  options?: { size?: number }
): Promise<TicketmasterEvent[]> {
  const now = new Date();
  const startDateTime = now.toISOString().split('.')[0] + 'Z';

  const params = new URLSearchParams({
    apikey: import.meta.env.VITE_TICKETMASTER_API_KEY,
    city: city,
    size: String(options?.size ?? 20),
    sort: 'date,asc',
    startDateTime,
  });

  try {
    const response = await fetch(`${BASE_URL}?${params}`);
    if (!response.ok) throw new Error(`Ticketmaster API error: ${response.status}`);
    const data = await response.json();
    return data._embedded?.events ?? [];
  } catch (err) {
    console.error('Ticketmaster fetch failed:', err);
    return [];
  }
}
