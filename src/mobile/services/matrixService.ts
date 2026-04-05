/**
 * Mapbox Matrix API — walk-time and walk-distance from an origin
 * to multiple destination venues.
 *
 * Handles the 25-destination-per-request limit by batching automatically.
 */

import { MAPBOX_TOKEN } from '../config/mapbox';
import { fetchJSON } from './fetchUtil';
import type { MatrixResult } from '../types';

const BASE = 'https://api.mapbox.com/directions-matrix/v1/mapbox/walking';
const MAX_DESTINATIONS_PER_CALL = 25;

interface MatrixResponse {
  durations: number[][];
  distances: number[][];
}

interface Destination {
  id: string;
  coordinates: [number, number]; // [lat, lng]
}

/**
 * Fetch walking times and distances from origin to each destination.
 *
 * @param origin        [lat, lng] — flipped to [lng, lat] for the API
 * @param destinations  Array of { id, coordinates: [lat, lng] }
 * @returns             MatrixResult[] sorted by walkSeconds ascending
 */
export async function fetchWalkTimes(
  origin: [number, number],
  destinations: Destination[],
): Promise<MatrixResult[]> {
  if (destinations.length === 0) return [];

  // Batch into chunks of MAX_DESTINATIONS_PER_CALL
  const batches: Destination[][] = [];
  for (let i = 0; i < destinations.length; i += MAX_DESTINATIONS_PER_CALL) {
    batches.push(destinations.slice(i, i + MAX_DESTINATIONS_PER_CALL));
  }

  const allResults: MatrixResult[] = [];

  for (const batch of batches) {
    const results = await fetchBatch(origin, batch);
    allResults.push(...results);
  }

  // Sort by walk time ascending
  allResults.sort((a, b) => a.walkSeconds - b.walkSeconds);
  return allResults;
}

async function fetchBatch(
  origin: [number, number],
  destinations: Destination[],
): Promise<MatrixResult[]> {
  const [oLat, oLng] = origin;

  // Build semicolon-separated coordinate string: origin first, then destinations
  const coords = [
    `${oLng},${oLat}`,
    ...destinations.map(d => `${d.coordinates[1]},${d.coordinates[0]}`),
  ].join(';');

  const url = `${BASE}/${coords}?sources=0&annotations=duration,distance&access_token=${MAPBOX_TOKEN}`;

  const data = await fetchJSON<MatrixResponse>(url);

  const durations = data.durations[0]; // row 0 = origin to all destinations
  const distances = data.distances[0];

  return destinations.map((dest, i) => ({
    venueId: dest.id,
    walkSeconds: Math.round(durations[i + 1] ?? 0), // +1 because index 0 is origin-to-origin
    walkMeters: Math.round(distances[i + 1] ?? 0),
  }));
}
