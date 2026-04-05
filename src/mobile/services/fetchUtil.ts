/**
 * Shared fetch utilities — retry, timeout, abort, JSON parsing.
 * All new data-source services import from here.
 */

const DEFAULT_RETRIES = 2;
const DEFAULT_TIMEOUT = 8000;

export interface FetchOptions {
  retries?: number;
  timeout?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

/** Fetch with exponential backoff retry + timeout */
export async function fetchWithRetry(
  url: string,
  opts: FetchOptions = {},
): Promise<Response> {
  const { retries = DEFAULT_RETRIES, timeout = DEFAULT_TIMEOUT, signal, headers } = opts;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        signal: signal ?? AbortSignal.timeout(timeout),
        headers,
      });
      if (res.ok) return res;
      // Don't retry client errors (4xx)
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`API error: ${res.status}`);
      }
      // Retry server errors (5xx)
      if (attempt === retries) throw new Error(`API error: ${res.status}`);
    } catch (err) {
      if (attempt === retries) throw err;
    }
    // Exponential backoff: 1s, 2s, 4s…
    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }
  throw new Error('Max retries exceeded');
}

/** Fetch + JSON parse with type safety */
export async function fetchJSON<T>(
  url: string,
  opts: FetchOptions = {},
): Promise<T> {
  const res = await fetchWithRetry(url, opts);
  return res.json() as Promise<T>;
}

/** Build URL with query params (filters out empty/undefined values) */
export function buildURL(base: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') search.set(k, String(v));
  }
  return `${base}?${search}`;
}

/** Safely extract error message from unknown caught value */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown error';
}
