import type { ChatMessage, Venue } from '../types';

/** Weighted keyword categories for scoring-based matching */
const CATEGORIES: { type: string; keywords: [string, number][]; handler: (venues: Venue[], cityName: string) => { text: string; data: any } }[] = [
  {
    type: 'recommendation',
    keywords: [['recommend', 3], ['suggest', 3], ['best', 2], ['should i', 3], ['where should', 3], ['top', 2], ['pick', 2], ['favorite', 1]],
    handler: (venues, cityName) => {
      const sorted = [...venues].sort((a, b) => {
        // Score: lower crowd + has HH + good rating = better
        const scoreA = (100 - a.pct) + (a.hasHH ? 15 : 0) + (a.rating ? a.rating * 5 : 0);
        const scoreB = (100 - b.pct) + (b.hasHH ? 15 : 0) + (b.rating ? b.rating * 5 : 0);
        return scoreB - scoreA;
      });
      const top = sorted[0];
      const alts = sorted.slice(1, 3);
      return {
        text: `My top pick in ${cityName} right now is ${top.name} — only ${top.pct}% full${top.hasHH ? ` with ${top.hhDeal}` : ''}${top.rating ? ` (${top.rating}★)` : ''}. Here are your best options:`,
        data: { type: 'recommendation', venues: [top, ...alts] },
      };
    },
  },
  {
    type: 'hh',
    keywords: [['happy hour', 4], ['hh', 3], ['deal', 2], ['special', 2], ['cheap', 1], ['discount', 1]],
    handler: (venues, _cityName) => {
      const hhVenues = venues.filter(v => v.hasHH);
      return {
        text: hhVenues.length > 0
          ? `Active happy hours right now: ${hhVenues.map(v => `${v.name} has ${v.hhDeal}`).join('. ')}.`
          : `No active happy hours found right now. Check back later!`,
        data: { type: 'hh', venues: hhVenues },
      };
    },
  },
  {
    type: 'quiet',
    keywords: [['quiet', 3], ['empty', 2], ['calm', 2], ['chill', 2], ['peaceful', 2], ['low-key', 3], ['not crowded', 3], ['not busy', 3]],
    handler: (venues, _cityName) => {
      const quietVenues = venues.filter(v => v.crowd === 'quiet');
      return {
        text: quietVenues.length > 0
          ? `Quiet spots nearby: ${quietVenues.map(v => `${v.name} (${v.pct}% full)`).join(', ')} are all great options.`
          : `Most places are moderate right now. Try visiting off-peak hours.`,
        data: { type: 'quiet', venues: quietVenues },
      };
    },
  },
  {
    type: 'restaurants',
    keywords: [['eat', 3], ['food', 3], ['restaurant', 3], ['dinner', 3], ['lunch', 2], ['brunch', 2], ['hungry', 2]],
    handler: (venues, cityName) => {
      const foodVenues = venues.filter(v =>
        v.type.toLowerCase().match(/restaurant|bbq|japanese|american|grill|bistro|diner|kitchen/)
      );
      return {
        text: `Here are the best dining options right now in ${cityName} based on crowd levels and wait times:`,
        data: { type: 'restaurants', venues: foodVenues.length > 0 ? foodVenues : venues.slice(0, 3) },
      };
    },
  },
  {
    type: 'crowd',
    keywords: [['busy', 3], ['crowd', 3], ['vibe', 2], ['packed', 2], ['crowded', 3], ['how full', 3], ['occupancy', 2]],
    handler: (venues, _cityName) => {
      const busy = venues.filter(v => v.crowd === 'busy');
      const quiet = venues.filter(v => v.crowd === 'quiet');
      return {
        text: `Based on current data, ${busy.length > 0 ? busy[0].name + ' is at ' + busy[0].pct + '% capacity (busier than usual)' : 'most areas are moderate'}. ${quiet.length > 0 ? quiet[0].name + ' is quiet at ' + quiet[0].pct + '% - great for a relaxed time!' : ''}`,
        data: { type: 'crowd', venues: venues.slice(0, 4) },
      };
    },
  },
  {
    type: 'timing',
    keywords: [['time', 2], ['when', 2], ['compare', 2], ['vs', 2], ['best time', 4], ['peak', 2], ['off-peak', 3]],
    handler: (_venues, cityName) => ({
      text: `Based on historical data, the best time to visit ${cityName} venues is between 2-4 PM (pre-dinner lull). For nightlife areas, 3-5 PM offers the best balance of atmosphere and crowd levels.`,
      data: { type: 'timing', chart: [45, 38, 32, 35, 48, 62, 78, 85, 82, 70, 55, 42] },
    }),
  },
  {
    type: 'events',
    keywords: [['event', 3], ['happening', 2], ['tonight', 2], ['going on', 3], ['show', 1], ['concert', 2]],
    handler: (_venues, cityName) => ({
      text: `Check the City Guide for live events happening in ${cityName}! Tap the KG button on the map to see what's on tonight.`,
      data: { type: 'events' },
    }),
  },
];

export function generateAIResponse(
  query: string,
  venues: Venue[],
  cityName: string
): ChatMessage {
  const lower = query.toLowerCase();

  // Score each category
  let bestType = '';
  let bestScore = 0;

  for (const cat of CATEGORIES) {
    let score = 0;
    for (const [kw, weight] of cat.keywords) {
      if (lower.includes(kw)) score += weight;
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = cat.type;
    }
  }

  let text: string;
  let data: any = null;

  if (bestScore > 0) {
    const cat = CATEGORIES.find(c => c.type === bestType)!;
    const result = cat.handler(venues, cityName);
    text = result.text;
    data = result.data;
  } else {
    // Fallback
    text = `I can help you find crowd levels, best times to visit, happy hour deals, and quiet spots in ${cityName}. Try asking "What's the best spot right now?" or "Where should I eat?"`;
  }

  return {
    id: (Date.now() + 1).toString(),
    type: 'ai',
    text,
    data,
    timestamp: new Date(),
  };
}

export const SUGGESTION_CHIPS = [
  'Is it busy right now?',
  'Best spot right now',
  'When should I go?',
  "What's happening tonight?",
  'Find quiet spots nearby',
  'Where should I eat?',
  'Best happy hour deals?',
  'Low-key dinner spots',
  'Recommend something',
];
