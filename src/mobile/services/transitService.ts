// TODO: Replace with real GTFS-RT feed when available
// Currently uses a simulation layer with real route names and realistic stop coordinates.

import type { LatLng, TransitStop, TransitArrival } from '../types';

/* ------------------------------------------------------------------ */
/*  City transit configs with real route names                        */
/* ------------------------------------------------------------------ */

interface RouteConfig {
  id: string;
  name: string;
  type: 'bus' | 'rail';
}

interface TransitConfig {
  cityId: string;
  center: LatLng;
  routes: RouteConfig[];
  stops: Array<{ id: string; name: string; coordinates: LatLng; routeIds: string[] }>;
}

const DALLAS_ROUTES: RouteConfig[] = [
  { id: 'red',    name: 'Red Line',    type: 'rail' },
  { id: 'blue',   name: 'Blue Line',   type: 'rail' },
  { id: 'green',  name: 'Green Line',  type: 'rail' },
  { id: 'orange', name: 'Orange Line', type: 'rail' },
  { id: 'bus-1',  name: 'Route 1',     type: 'bus' },
  { id: 'bus-2',  name: 'Route 2',     type: 'bus' },
  { id: 'bus-3',  name: 'Route 3',     type: 'bus' },
  { id: 'bus-4',  name: 'Route 4',     type: 'bus' },
  { id: 'bus-15', name: 'Route 15',    type: 'bus' },
  { id: 'bus-21', name: 'Route 21',    type: 'bus' },
  { id: 'bus-22', name: 'Route 22',    type: 'bus' },
  { id: 'bus-39', name: 'Route 39',    type: 'bus' },
  { id: 'bus-42', name: 'Route 42',    type: 'bus' },
  { id: 'bus-44', name: 'Route 44',    type: 'bus' },
  { id: 'bus-60', name: 'Route 60',    type: 'bus' },
  { id: 'bus-63', name: 'Route 63',    type: 'bus' },
];

const RENO_ROUTES: RouteConfig[] = [
  { id: 'rtc-1',  name: '1 Virginia',      type: 'bus' },
  { id: 'rtc-2',  name: '2 Prater',        type: 'bus' },
  { id: 'rtc-5',  name: '5 Sun Valley',    type: 'bus' },
  { id: 'rtc-6',  name: '6 Mill/Glendale', type: 'bus' },
  { id: 'rtc-7',  name: '7 Neil Road',     type: 'bus' },
  { id: 'rtc-9',  name: '9 Sutro',         type: 'bus' },
  { id: 'rtc-11', name: '11 Virginia/Plumb', type: 'bus' },
];

const CITY_TRANSIT: Record<string, TransitConfig> = {
  dallas: {
    cityId: 'dallas',
    center: [32.7767, -96.7970],
    routes: DALLAS_ROUTES,
    stops: [
      // DART Rail stations
      { id: 'dal-01', name: 'West End Station',       coordinates: [32.7810, -96.8057], routeIds: ['red', 'blue'] },
      { id: 'dal-02', name: 'Akard Station',          coordinates: [32.7815, -96.7985], routeIds: ['red', 'blue', 'green', 'orange'] },
      { id: 'dal-03', name: 'St. Paul Station',       coordinates: [32.7818, -96.7935], routeIds: ['red', 'blue'] },
      { id: 'dal-04', name: 'Pearl / Arts District',  coordinates: [32.7870, -96.7920], routeIds: ['red', 'green', 'orange'] },
      { id: 'dal-05', name: 'Cityplace / Uptown',     coordinates: [32.7940, -96.7968], routeIds: ['red'] },
      { id: 'dal-06', name: 'Mockingbird Station',    coordinates: [32.8378, -96.7841], routeIds: ['red'] },
      { id: 'dal-07', name: 'Union Station',          coordinates: [32.7756, -96.8073], routeIds: ['red', 'blue', 'green', 'orange'] },
      { id: 'dal-08', name: 'Convention Center',      coordinates: [32.7753, -96.7989], routeIds: ['blue', 'green'] },
      { id: 'dal-09', name: 'Deep Ellum Station',     coordinates: [32.7826, -96.7826], routeIds: ['green'] },
      { id: 'dal-10', name: 'Baylor Univ. Medical',   coordinates: [32.7850, -96.7780], routeIds: ['green'] },
      // Bus stops
      { id: 'dal-11', name: 'Elm St & Griffin',        coordinates: [32.7805, -96.8020], routeIds: ['bus-1', 'bus-2'] },
      { id: 'dal-12', name: 'Commerce St & Ervay',     coordinates: [32.7790, -96.7982], routeIds: ['bus-3', 'bus-4'] },
      { id: 'dal-13', name: 'Ross Ave & Pearl',        coordinates: [32.7860, -96.7900], routeIds: ['bus-15', 'bus-21'] },
      { id: 'dal-14', name: 'Martin Luther King Blvd', coordinates: [32.7850, -96.7730], routeIds: ['bus-22', 'bus-39'] },
      { id: 'dal-15', name: 'Lamar St & Commerce',     coordinates: [32.7775, -96.8040], routeIds: ['bus-42', 'bus-44'] },
      { id: 'dal-16', name: 'Bryan St & Harwood',      coordinates: [32.7860, -96.7950], routeIds: ['bus-60', 'bus-63'] },
      { id: 'dal-17', name: 'Main St & Lamar',         coordinates: [32.7797, -96.8045], routeIds: ['bus-1', 'bus-15'] },
      { id: 'dal-18', name: 'Greenville Ave & Ross',   coordinates: [32.7890, -96.7710], routeIds: ['bus-3', 'bus-21'] },
      { id: 'dal-19', name: 'Gaston Ave & Peak',       coordinates: [32.7880, -96.7730], routeIds: ['bus-60'] },
      { id: 'dal-20', name: 'McKinney Ave & Olive',    coordinates: [32.7930, -96.7980], routeIds: ['bus-39', 'bus-63'] },
    ],
  },
  reno: {
    cityId: 'reno',
    center: [39.5296, -119.8138],
    routes: RENO_ROUTES,
    stops: [
      { id: 'ren-01', name: '4th St Station',          coordinates: [39.5276, -119.8145], routeIds: ['rtc-1', 'rtc-2', 'rtc-5', 'rtc-6'] },
      { id: 'ren-02', name: 'Virginia St & 2nd',       coordinates: [39.5300, -119.8143], routeIds: ['rtc-1', 'rtc-11'] },
      { id: 'ren-03', name: 'Virginia St & Plumb',     coordinates: [39.5105, -119.8098], routeIds: ['rtc-1', 'rtc-11'] },
      { id: 'ren-04', name: 'Prater Way & El Rancho',  coordinates: [39.5370, -119.7870], routeIds: ['rtc-2'] },
      { id: 'ren-05', name: 'Sun Valley Blvd & 7th',   coordinates: [39.5590, -119.8050], routeIds: ['rtc-5'] },
      { id: 'ren-06', name: 'Mill St & Terminal Way',   coordinates: [39.5220, -119.8070], routeIds: ['rtc-6'] },
      { id: 'ren-07', name: 'Neil Rd & Meadowood',     coordinates: [39.4960, -119.7960], routeIds: ['rtc-7'] },
      { id: 'ren-08', name: 'Sutro St & Washington',   coordinates: [39.5360, -119.8200], routeIds: ['rtc-9'] },
      { id: 'ren-09', name: 'Center St & 1st',         coordinates: [39.5310, -119.8160], routeIds: ['rtc-1', 'rtc-6'] },
      { id: 'ren-10', name: 'Sierra St & Liberty',     coordinates: [39.5290, -119.8175], routeIds: ['rtc-2', 'rtc-9'] },
      { id: 'ren-11', name: 'Kietzke Ln & Moana',     coordinates: [39.5050, -119.7880], routeIds: ['rtc-7'] },
      { id: 'ren-12', name: 'McCarran Blvd & Virginia', coordinates: [39.4890, -119.8060], routeIds: ['rtc-1', 'rtc-7'] },
      { id: 'ren-13', name: 'UNR Transit Center',      coordinates: [39.5420, -119.8150], routeIds: ['rtc-1', 'rtc-5', 'rtc-9'] },
      { id: 'ren-14', name: 'Reno-Sparks Convention',  coordinates: [39.5270, -119.8080], routeIds: ['rtc-2', 'rtc-6'] },
      { id: 'ren-15', name: 'Meadowood Mall',          coordinates: [39.4910, -119.7870], routeIds: ['rtc-7', 'rtc-11'] },
      { id: 'ren-16', name: 'Glendale Ave & Wells',    coordinates: [39.5160, -119.8020], routeIds: ['rtc-6'] },
      { id: 'ren-17', name: 'Plumb Ln & Kietzke',     coordinates: [39.5100, -119.7900], routeIds: ['rtc-11'] },
      { id: 'ren-18', name: 'S Virginia & Manzanita',  coordinates: [39.4990, -119.8010], routeIds: ['rtc-1'] },
      { id: 'ren-19', name: 'Prater Way & Pyramid',    coordinates: [39.5350, -119.7740], routeIds: ['rtc-2'] },
      { id: 'ren-20', name: 'Sun Valley Blvd & Gepford', coordinates: [39.5680, -119.8100], routeIds: ['rtc-5'] },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Haversine distance helper                                         */
/* ------------------------------------------------------------------ */

const R_KM = 6371;

export function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinLng * sinLng;
  return R_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/* ------------------------------------------------------------------ */
/*  Simulated arrival generation                                      */
/* ------------------------------------------------------------------ */

function simulateArrivals(
  stop: TransitConfig['stops'][number],
  routes: RouteConfig[],
): TransitArrival[] {
  const now = Date.now();
  const arrivals: TransitArrival[] = [];

  for (const routeId of stop.routeIds) {
    const route = routes.find(r => r.id === routeId);
    if (!route) continue;

    // Generate next 3 arrivals per route, spaced 5–30 minutes apart
    let baseOffset = Math.floor(Math.random() * 8) + 2; // 2–10 min for first arrival
    for (let i = 0; i < 3; i++) {
      const minutesOut = baseOffset + i * (Math.floor(Math.random() * 12) + 8); // 8–20 min gaps
      const delaySec = Math.random() < 0.3 ? Math.floor(Math.random() * 180) + 60 : 0; // ~30% chance of 1–3 min delay

      arrivals.push({
        routeId: route.id,
        routeName: route.name,
        stopName: stop.name,
        arrivalTime: now + minutesOut * 60_000,
        delaySeconds: delaySec,
        vehicleType: route.type === 'rail' ? 'rail' : 'bus',
        headsign: route.name,
      });
    }
  }

  return arrivals.sort((a, b) => a.arrivalTime - b.arrivalTime);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

const DEFAULT_RADIUS_KM = 1.5;

/** Return transit stops within `radius` km of the given coordinates. */
export async function fetchNearbyStops(
  lat: number,
  lng: number,
  cityId: string,
  radius: number = DEFAULT_RADIUS_KM,
): Promise<TransitStop[]> {
  const config = CITY_TRANSIT[cityId];
  if (!config) return [];

  const userPos: [number, number] = [lat, lng];

  return config.stops
    .filter(s => haversineKm(userPos, s.coordinates) <= radius)
    .map(s => ({
      id: s.id,
      name: s.name,
      coordinates: s.coordinates,
      vehicleType: (config.routes.find(r => r.id === s.routeIds[0])?.type === 'rail'
        ? 'rail'
        : 'bus') as TransitStop['vehicleType'],
      routes: s.routeIds,
    }));
}

/** Return simulated arrivals for a specific stop. */
export async function fetchArrivals(
  stopId: string,
  cityId: string,
): Promise<TransitArrival[]> {
  const config = CITY_TRANSIT[cityId];
  if (!config) return [];

  const stop = config.stops.find(s => s.id === stopId);
  if (!stop) return [];

  return simulateArrivals(stop, config.routes);
}
