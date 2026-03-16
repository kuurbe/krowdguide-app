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
