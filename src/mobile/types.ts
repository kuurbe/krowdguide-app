// ── Branded Types — prevent mixing IDs across domains ───

declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type CityId = Brand<string, 'CityId'>;
export type VenueId = Brand<string, 'VenueId'>;

/** Type-safe coordinate tuple — [lat, lng] */
export type LatLng = [lat: number, lng: number];


// ── Core Models ─────────────────────────────────────────

export interface City {
  id: string;
  name: string;
  state: string;
  coordinates: LatLng;
  zoom: number;
}

export interface Venue {
  id: string;
  name: string;
  icon: string;
  type: string;
  crowd: 'quiet' | 'moderate' | 'busy';
  pct: number;
  dist: string;
  wait?: string;
  hasHH?: boolean;
  hhDeal?: string;
  image?: string;
  rating?: number;
  coordinates: LatLng;
}

export interface KrowdEvent {
  id: string;
  name: string;
  icon: string;
  venue: string;
  time: string;
  type: string;
  image?: string;
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      location?: {
        latitude: string;
        longitude: string;
      };
    }>;
  };
  images: Array<{ url: string; width: number; height: number }>;
  classifications?: Array<{
    segment?: { name: string };
    genre?: { name: string };
  }>;
}

export interface Alert {
  id: string;
  icon: string;
  title: string;
  tag: string;
  text: string;
  loc: string;
  time: string;
  up: number;
  dn: number;
  trusted?: boolean;
}

// ── Chat Message — discriminated union by type ──────────

/** AI response categories for type-safe data handling */
export type AIResponseType = 'crowd' | 'restaurants' | 'hh' | 'quiet' | 'timing' | 'recommendation';

export interface AIResponseData {
  type: AIResponseType;
  venues?: Venue[];
  chart?: number[];
}

interface ChatMessageBase {
  id: string;
  text: string;
  timestamp: Date;
}

export interface UserMessage extends ChatMessageBase {
  type: 'user';
  data?: never;
}

export interface AIMessage extends ChatMessageBase {
  type: 'ai';
  data?: AIResponseData;
}

/** Discriminated union — narrows `data` based on `type` field */
export type ChatMessage = UserMessage | AIMessage;

export interface ThingToDo {
  id: string;
  name: string;
  icon: string;
  desc: string;
  crowd: 'quiet' | 'moderate' | 'busy';
  image: string;
  coordinates: LatLng;
}

/** B2B Oracle server JSON schema */
export interface OraclePulse {
  venue: string;
  metrics: {
    occupancy_pct: number;
    safety_status: string;
    vibe_score: string;
  };
  community_check: {
    thumbs_up: number;
    thumbs_down: number;
    last_verified: string;
  };
}


// ── Extended Travel Modes ──────────────────────────────────
// Note: base TravelMode is defined in services/directionsService.ts
// and imported from there by context.tsx and components.

import type { TravelMode } from './services/directionsService';
export type TravelModeExtended = TravelMode | 'transit' | 'scooter';

// ── Toggleable Map Data Layers ─────────────────────────────

export type DataLayerType =
  | 'isochrone'
  | 'weather'
  | 'aqi'
  | 'transit'
  | 'ev'
  | 'bikes'
  | 'accessibility';


// ── Weather (NWS + Open-Meteo) ─────────────────────────────

export interface WeatherData {
  temperature: number;       // Fahrenheit
  temperatureC: number;      // Celsius
  description: string;       // e.g. "Partly Cloudy"
  icon: WeatherIcon;
  windSpeed: string;         // e.g. "12 mph"
  humidity?: number;         // 0-100
  feelsLike?: number;        // Fahrenheit
  source: 'nws' | 'open-meteo';
  fetchedAt: number;         // epoch ms
}

export type WeatherIcon =
  | 'sun' | 'cloud' | 'cloud-sun' | 'cloud-rain'
  | 'cloud-snow' | 'cloud-lightning' | 'cloud-fog' | 'wind';


// ── Air Quality (AirNow EPA) ───────────────────────────────

export interface AQIData {
  aqi: number;               // 0-500
  category: string;          // "Good", "Moderate", "Unhealthy for Sensitive Groups", etc.
  pollutant: string;         // "PM2.5", "O3", etc.
  color: string;             // hex color for the AQI level
  source: 'airnow';
  fetchedAt: number;
}


// ── Seismic Alerts (USGS) ──────────────────────────────────

export interface SeismicAlert {
  id: string;
  magnitude: number;
  place: string;             // e.g. "12km NE of Reno, Nevada"
  time: number;              // epoch ms
  url: string;               // USGS detail page
}


// ── Transit (GTFS-Realtime) ────────────────────────────────

export interface TransitArrival {
  routeId: string;
  routeName: string;         // e.g. "Red Line", "Route 42"
  stopName: string;
  arrivalTime: number;       // epoch ms
  delaySeconds: number;      // negative = early, positive = late
  vehicleType: 'bus' | 'rail' | 'tram' | 'ferry';
  headsign?: string;         // e.g. "Downtown Dallas"
}

export interface TransitStop {
  id: string;
  name: string;
  coordinates: LatLng;
  vehicleType: 'bus' | 'rail' | 'tram' | 'ferry';
  routes: string[];          // route names serving this stop
}


// ── Bike / Scooter (GBFS) ─────────────────────────────────

export interface BikeStation {
  id: string;
  name: string;
  coordinates: LatLng;
  bikesAvailable: number;
  ebikesAvailable: number;
  docksAvailable: number;
  isRenting: boolean;
  operator: string;          // e.g. "Lime", "CitiBike"
}


// ── Mapbox Isochrone ───────────────────────────────────────

export interface IsochroneResult {
  minutes: number[];
  /** GeoJSON FeatureCollection from Mapbox Isochrone API */
  geojson: Record<string, unknown>;
  mode: 'walking' | 'driving' | 'cycling';
  center: LatLng;
  fetchedAt: number;
}


// ── Mapbox Matrix ──────────────────────────────────────────

export interface MatrixResult {
  venueId: string;
  walkSeconds: number;       // actual walk time
  walkMeters: number;        // actual walk distance
}


// ── Foursquare Places (v3) ─────────────────────────────────

export interface FoursquareVenue {
  fsqId: string;
  name: string;
  categories: Array<{ name: string; icon: { prefix: string; suffix: string } }>;
  coordinates: LatLng;
  address?: string;
  hours?: {
    display: string;         // e.g. "Mon-Fri 9am-10pm"
    isOpen: boolean;
  };
  rating?: number;           // out of 10
  photos?: string[];         // photo URLs
  tips?: Array<{ text: string; createdAt: string }>;
  price?: number;            // 1-4 ($-$$$$)
  website?: string;
}


// ── Map POI — tapped business from Mapbox Standard style ────

export interface MapPOI {
  name: string;
  group: string;           // e.g. "food_and_drink", "shopping", "poi"
  coordinates: [number, number]; // [lng, lat] — Mapbox format
}


// ── Bandsintown Events ─────────────────────────────────────

export interface BandsintownEvent {
  id: string;
  artistName: string;
  url: string;
  datetime: string;          // ISO 8601
  venue: {
    name: string;
    city: string;
    region: string;
    country: string;
    latitude: string;
    longitude: string;
  };
  lineup: string[];
  description?: string;
  offers?: Array<{ type: string; url: string; status: string }>;
}


// ── EV Charging Stations ───────────────────────────────────

export interface EVStation {
  id: string;
  name: string;
  coordinates: LatLng;
  address: string;
  network?: string;          // e.g. "ChargePoint", "Tesla"
  connectorTypes: string[];  // e.g. ["CCS", "CHAdeMO", "J1772"]
  numPorts: number;
  isFree: boolean;
  source: 'ocm' | 'nrel';
}


// ── Accessibility (Wheelmap + Project Sidewalk) ────────────

export interface AccessibilityNode {
  id: string;
  name?: string;
  coordinates: LatLng;
  wheelchairStatus: 'yes' | 'limited' | 'no' | 'unknown';
  category?: string;
  source: 'wheelmap' | 'sidewalk';
}


// ── Unified Event (merged Ticketmaster + Bandsintown) ──────

export interface UnifiedEvent {
  id: string;
  name: string;
  datetime: string;
  venueName: string;
  coordinates?: LatLng;
  imageUrl?: string;
  url: string;
  source: 'ticketmaster' | 'bandsintown';
  category?: string;         // "Music", "Sports", "Arts", etc.
  artists?: string[];
}


// ── Growth Tier: BestTime.app ──────────────────────────────

export interface BusynessData {
  venueName: string;
  dayRaw: number[];          // 24 values, 0-100 busyness per hour
  livePercentage?: number;   // real-time busyness 0-100
  peakHours: number[];       // hour indices of peak times
  quietHours: number[];      // hour indices of quiet times
  source: 'besttime';
  fetchedAt: number;
}

// ── Growth Tier: PredictHQ ─────────────────────────────────

export interface PredictHQEvent {
  id: string;
  title: string;
  category: string;
  rank: number;              // 0-100 impact score
  localStart: string;
  localEnd?: string;
  coordinates: LatLng;
  labels: string[];
}

// ── Growth Tier: Tomorrow.io ───────────────────────────────

export interface MinuteWeather {
  timestamp: string;
  precipitationIntensity: number;
  precipitationType: 'none' | 'rain' | 'snow' | 'ice';
  temperature?: number;
}
