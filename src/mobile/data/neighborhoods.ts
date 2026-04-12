/**
 * Neighborhoods per city — powers the CityGuide Neighborhood Pulse Grid.
 * Crowd density is derived client-side from the venues that fall in each zone,
 * but we keep the list static for now (no venue-to-neighborhood mapping in the
 * mock data).
 */

export interface Neighborhood {
  id: string;
  name: string;
  emoji: string;
  venueCount: number;
  cityId: string;
  vibe: string; // short 1-word flavor
}

const DALLAS: Neighborhood[] = [
  { id: 'dal-de', name: 'Deep Ellum', emoji: '🎸', venueCount: 18, cityId: 'dallas', vibe: 'Live' },
  { id: 'dal-ba', name: 'Bishop Arts', emoji: '🎨', venueCount: 12, cityId: 'dallas', vibe: 'Chill' },
  { id: 'dal-up', name: 'Uptown', emoji: '🍸', venueCount: 22, cityId: 'dallas', vibe: 'Hot' },
  { id: 'dal-kn', name: 'Knox-Henderson', emoji: '🍽️', venueCount: 14, cityId: 'dallas', vibe: 'Foodie' },
  { id: 'dal-gr', name: 'Greenville', emoji: '🌳', venueCount: 9, cityId: 'dallas', vibe: 'Local' },
  { id: 'dal-vc', name: 'Victory Park', emoji: '🏟️', venueCount: 8, cityId: 'dallas', vibe: 'Events' },
];

const RENO: Neighborhood[] = [
  { id: 'ren-mt', name: 'Midtown', emoji: '☕', venueCount: 16, cityId: 'reno', vibe: 'Indie' },
  { id: 'ren-dr', name: 'Downtown', emoji: '🎰', venueCount: 24, cityId: 'reno', vibe: 'Hot' },
  { id: 'ren-ad', name: 'Arts District', emoji: '🎨', venueCount: 10, cityId: 'reno', vibe: 'Creative' },
  { id: 'ren-wl', name: 'Riverwalk', emoji: '🌊', venueCount: 13, cityId: 'reno', vibe: 'Chill' },
  { id: 'ren-ol', name: 'Old Southwest', emoji: '🏡', venueCount: 7, cityId: 'reno', vibe: 'Cozy' },
  { id: 'ren-ue', name: 'University', emoji: '🎓', venueCount: 11, cityId: 'reno', vibe: 'Young' },
];

export function getNeighborhoodsForCity(cityId: string): Neighborhood[] {
  if (cityId === 'dallas') return DALLAS;
  if (cityId === 'reno') return RENO;
  return [];
}

/**
 * Deterministic crowd % per neighborhood based on a hash of the id + current hour.
 * In production this would come from the venue aggregation endpoint.
 */
export function getNeighborhoodCrowd(hood: Neighborhood): number {
  const hour = new Date().getHours();
  const seed = hood.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  // Day curve: low in morning, peaks in evening
  const dayCurve = Math.exp(-Math.pow((hour - 21) / 5, 2)) * 80 + 15;
  // Venue count bonus (more venues → busier)
  const venueBoost = (hood.venueCount / 25) * 15;
  // Per-hood variance
  const variance = ((Math.sin(seed) + 1) / 2) * 20 - 10;
  return Math.max(5, Math.min(95, Math.round(dayCurve + venueBoost + variance)));
}

export function crowdLevel(pct: number): 'quiet' | 'moderate' | 'busy' | 'peak' {
  if (pct < 30) return 'quiet';
  if (pct < 55) return 'moderate';
  if (pct < 80) return 'busy';
  return 'peak';
}
