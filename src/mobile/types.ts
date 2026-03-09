export interface City {
  id: string;
  name: string;
  state: string;
  coordinates: [number, number];
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
  coordinates: [number, number];
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

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  data?: any;
  timestamp: Date;
}

export interface ThingToDo {
  id: string;
  name: string;
  icon: string;
  desc: string;
  crowd: 'quiet' | 'moderate' | 'busy';
  image: string;
  coordinates: [number, number];
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
