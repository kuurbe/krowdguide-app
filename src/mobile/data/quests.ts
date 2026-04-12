/**
 * Mock quest data — AI-curated walking tours and missions.
 * In production these would be generated from the venue graph + user preferences.
 */

export interface Quest {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  distance: string;
  duration: string;
  stops: number;
  xp: number;
  accent: string;
  difficulty: 'chill' | 'standard' | 'ambitious';
  cityId: string;
}

const DALLAS_QUESTS: Quest[] = [
  {
    id: 'dal-q1',
    title: 'Deep Ellum Dive',
    subtitle: '4-stop live music + taco crawl',
    emoji: 'music',
    distance: '1.2 mi',
    duration: '2h',
    stops: 4,
    xp: 240,
    accent: '#ff4d6a',
    difficulty: 'standard',
    cityId: 'dallas',
  },
  {
    id: 'dal-q2',
    title: 'Bishop Arts Slow Sunday',
    subtitle: 'Coffee, bookstores, hidden patios',
    emoji: 'coffee',
    distance: '0.8 mi',
    duration: '90m',
    stops: 5,
    xp: 180,
    accent: '#ff8c42',
    difficulty: 'chill',
    cityId: 'dallas',
  },
  {
    id: 'dal-q3',
    title: 'Uptown Rooftop Run',
    subtitle: 'Golden-hour views across 3 rooftops',
    emoji: 'sunset',
    distance: '1.5 mi',
    duration: '2.5h',
    stops: 3,
    xp: 300,
    accent: '#a855f7',
    difficulty: 'ambitious',
    cityId: 'dallas',
  },
];

const RENO_QUESTS: Quest[] = [
  {
    id: 'ren-q1',
    title: 'Midtown Mellow',
    subtitle: 'Quiet coffee + indie shops loop',
    emoji: 'leaf',
    distance: '0.9 mi',
    duration: '90m',
    stops: 4,
    xp: 180,
    accent: '#34d399',
    difficulty: 'chill',
    cityId: 'reno',
  },
  {
    id: 'ren-q2',
    title: 'Riverwalk Revel',
    subtitle: 'Breweries along the Truckee',
    emoji: 'beer',
    distance: '1.1 mi',
    duration: '2h',
    stops: 4,
    xp: 220,
    accent: '#ff8c42',
    difficulty: 'standard',
    cityId: 'reno',
  },
  {
    id: 'ren-q3',
    title: 'Arts District Hunt',
    subtitle: 'Hidden galleries + late-night eats',
    emoji: 'palette',
    distance: '1.4 mi',
    duration: '2.5h',
    stops: 5,
    xp: 280,
    accent: '#a855f7',
    difficulty: 'ambitious',
    cityId: 'reno',
  },
];

export function getQuestsForCity(cityId: string): Quest[] {
  if (cityId === 'dallas') return DALLAS_QUESTS;
  if (cityId === 'reno') return RENO_QUESTS;
  return [];
}
