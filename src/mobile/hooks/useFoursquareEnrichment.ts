import { useState, useEffect, useRef } from 'react';
import type { FoursquareVenue } from '../types';
import { searchFoursquarePlaces } from '../services/foursquareService';

/**
 * Lazy enrichment hook — only fetches when a specific venue is opened.
 * Searches Foursquare by coordinates, then picks the best name match.
 */
export function useFoursquareEnrichment(
  venueName: string | null,
  coordinates: [number, number] | null,
) {
  const [enrichment, setEnrichment] = useState<FoursquareVenue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Record<string, FoursquareVenue | null>>({});

  useEffect(() => {
    if (!venueName || !coordinates) {
      setEnrichment(null);
      return;
    }

    if (venueName in cache.current) {
      setEnrichment(cache.current[venueName]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const [lat, lng] = coordinates;

    searchFoursquarePlaces(lat, lng, venueName)
      .then((results) => {
        if (cancelled) return;

        const match = findBestMatch(results, venueName);
        cache.current[venueName] = match;
        setEnrichment(match);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Enrichment failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [venueName, coordinates]);

  return { enrichment, loading, error };
}

/**
 * Simple name-similarity match: checks if either name contains
 * the other (case-insensitive, stripped of non-alphanumeric chars).
 * Falls back to the first result if no strong match found.
 */
function findBestMatch(
  results: FoursquareVenue[],
  targetName: string,
): FoursquareVenue | null {
  if (results.length === 0) return null;

  const target = normalize(targetName);

  // Exact-ish match first
  for (const r of results) {
    const candidate = normalize(r.name);
    if (candidate === target) return r;
  }

  // Substring match
  for (const r of results) {
    const candidate = normalize(r.name);
    if (candidate.includes(target) || target.includes(candidate)) return r;
  }

  // Fallback: closest result (search already ranked by proximity)
  return results[0];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}
