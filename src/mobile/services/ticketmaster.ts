import type { TicketmasterEvent } from '../types';

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';
const MAX_RETRIES = 2;

/** Fetch with exponential backoff retry */
async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(tid);
      if (res.ok) return res;
      // Don't retry client errors (4xx)
      if (res.status >= 400 && res.status < 500) throw new Error(`API error: ${res.status}`);
      // Retry server errors (5xx)
      if (attempt === retries) throw new Error(`API error: ${res.status}`);
    } catch (err) {
      if (attempt === retries) throw err;
    }
    // Exponential backoff: 1s, 2s
    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }
  throw new Error('Max retries exceeded');
}

export interface FetchEventsResult {
  events: TicketmasterEvent[];
  error: string | null;
}

export async function fetchEvents(
  city: string,
  options?: { size?: number; signal?: AbortSignal }
): Promise<FetchEventsResult> {
  const apiKey = import.meta.env.VITE_TICKETMASTER_API_KEY;
  if (!apiKey) {
    return { events: [], error: 'Ticketmaster API key not configured' };
  }

  const now = new Date();
  const startDateTime = now.toISOString().split('.')[0] + 'Z';

  const params = new URLSearchParams({
    apikey: apiKey,
    city: city,
    size: String(options?.size ?? 20),
    sort: 'date,asc',
    startDateTime,
  });

  try {
    const response = await fetchWithRetry(`${BASE_URL}?${params}`);
    const data = await response.json();

    // Validate response shape
    const events = data?._embedded?.events;
    if (!Array.isArray(events)) {
      return { events: [], error: null }; // Valid but empty response
    }

    return { events: events as TicketmasterEvent[], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch events';
    if (import.meta.env.DEV) {
      console.error('[Ticketmaster]', message);
    }
    return { events: [], error: message };
  }
}
