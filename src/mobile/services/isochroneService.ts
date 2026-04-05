/**
 * Mapbox Isochrone API — travel-time polygons.
 * Returns GeoJSON FeatureCollection showing reachable area
 * within given minute thresholds from a center point.
 */

import { MAPBOX_TOKEN } from '../config/mapbox';
import { fetchJSON } from './fetchUtil';

const BASE = 'https://api.mapbox.com/isochrone/v1/mapbox';

/**
 * Fetch isochrone polygon(s) from Mapbox.
 *
 * @param center  [lat, lng] — flipped to [lng, lat] for the API
 * @param minutes Array of contour thresholds, e.g. [5, 10, 15]
 * @param mode    Mapbox profile: 'walking' | 'driving' | 'cycling'
 * @returns       GeoJSON FeatureCollection with one Feature per contour
 */
export async function fetchIsochrone(
  center: [number, number],
  minutes: number[] = [5, 10, 15],
  mode: string = 'walking',
): Promise<Record<string, unknown>> {
  const [lat, lng] = center;
  const mins = minutes.join(',');
  const url = `${BASE}/${mode}/${lng},${lat}?contours_minutes=${mins}&polygons=true&access_token=${MAPBOX_TOKEN}`;

  return fetchJSON<Record<string, unknown>>(url);
}
