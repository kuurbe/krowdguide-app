import type { ChatMessage, Venue } from '../types';

export function generateAIResponse(
  query: string,
  venues: Venue[],
  cityName: string
): ChatMessage {
  const lower = query.toLowerCase();
  let response = '';
  let data = null;

  if (lower.includes('busy') || lower.includes('crowd') || lower.includes('vibe')) {
    const busy = venues.filter(v => v.crowd === 'busy');
    const quiet = venues.filter(v => v.crowd === 'quiet');
    response = `Based on current data, ${busy.length > 0 ? busy[0].name + ' is at ' + busy[0].pct + '% capacity (busier than usual)' : 'most areas are moderate'}. ${quiet.length > 0 ? quiet[0].name + ' is quiet at ' + quiet[0].pct + '% - great for a relaxed time!' : ''}`;
    data = { type: 'crowd', venues: venues.slice(0, 3) };
  } else if (lower.includes('eat') || lower.includes('food') || lower.includes('restaurant')) {
    response = `Here are the best dining options right now in ${cityName} based on crowd levels and wait times:`;
    data = { type: 'restaurants', venues: venues.filter(v => v.type.includes('Restaurant') || v.type.includes('BBQ') || v.type.includes('Japanese')) };
  } else if (lower.includes('happy hour') || lower.includes('hh') || lower.includes('deal')) {
    const hhVenues = venues.filter(v => v.hasHH);
    response = hhVenues.length > 0
      ? `Active happy hours right now: ${hhVenues.map(v => `${v.name} has ${v.hhDeal}`).join('. ')}.`
      : `No active happy hours found right now in ${cityName}. Check back later!`;
    data = { type: 'hh', venues: hhVenues };
  } else if (lower.includes('quiet') || lower.includes('empty') || lower.includes('calm')) {
    const quietVenues = venues.filter(v => v.crowd === 'quiet');
    response = quietVenues.length > 0
      ? `Quiet spots nearby: ${quietVenues.map(v => `${v.name} (${v.pct}% full)`).join(', ')} are all great options.`
      : `Most places are moderate right now. Try visiting off-peak hours.`;
    data = { type: 'quiet', venues: quietVenues };
  } else if (lower.includes('time') || lower.includes('when') || lower.includes('compare')) {
    response = `Based on historical data, the best time to visit ${cityName} venues is between 2-4 PM (pre-dinner lull). For nightlife areas, 3-5 PM offers the best balance of atmosphere and crowd levels.`;
    data = { type: 'timing', chart: [45, 38, 32, 35, 48, 62, 78, 85, 82, 70, 55, 42] };
  } else if (lower.includes('event') || lower.includes('happening') || lower.includes('tonight') || lower.includes('going on')) {
    response = `Check the City Guide for live events happening in ${cityName}! Tap the KG button on the map to see what's on tonight.`;
    data = { type: 'events' };
  } else {
    response = `I can help you find crowd levels, best times to visit, happy hour deals, and quiet spots in ${cityName}. What would you like to know?`;
  }

  return {
    id: (Date.now() + 1).toString(),
    type: 'ai',
    text: response,
    data,
    timestamp: new Date(),
  };
}

export const SUGGESTION_CHIPS = [
  'Is it busy right now?',
  'When should I go?',
  'Compare 6pm vs 9pm',
  "What's happening tonight?",
  'Find quiet spots nearby',
  'Where should I eat?',
  'Best happy hour deals?',
  'Crowded places to avoid',
];
