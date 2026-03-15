import { MAPBOX_TOKEN } from '../config/mapbox';

export type TravelMode = 'walking' | 'driving' | 'cycling';

export interface DirectionsStep {
  instruction: string;
  distance: number;   // meters
  duration: number;   // seconds
  maneuver: { type: string; modifier?: string };
}

export interface DirectionsRoute {
  geometry: GeoJSON.LineString;
  duration: number;   // seconds
  distance: number;   // meters
  steps: DirectionsStep[];
}

/** Fetch a route from Mapbox Directions API */
export async function fetchDirections(
  origin: [number, number],       // [lng, lat]
  destination: [number, number],  // [lng, lat]
  mode: TravelMode = 'walking'
): Promise<DirectionsRoute> {
  const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?steps=true&geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Directions API error: ${res.status}`);

  const data = await res.json();
  if (!data.routes?.length) throw new Error('No route found');

  const route = data.routes[0];
  const leg = route.legs[0];

  return {
    geometry: route.geometry as GeoJSON.LineString,
    duration: route.duration,
    distance: route.distance,
    steps: (leg.steps || []).map((s: any) => ({
      instruction: s.maneuver?.instruction || '',
      distance: s.distance,
      duration: s.duration,
      maneuver: {
        type: s.maneuver?.type || 'turn',
        modifier: s.maneuver?.modifier,
      },
    })),
  };
}

/** Format distance for display */
export function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return miles < 0.1 ? `${Math.round(meters)} ft` : `${miles.toFixed(1)} mi`;
}

/** Format duration for display */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`;
}
