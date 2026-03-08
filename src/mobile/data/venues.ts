import type { Venue, ThingToDo } from '../types';

export const DALLAS_VENUES: Venue[] = [
  { id: 'd1', name: 'Pecan Lodge BBQ', icon: '🍖', type: 'BBQ Restaurant', crowd: 'busy', pct: 91, dist: '0.4 mi', wait: '45 min', hasHH: false, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', coordinates: [32.7831, -96.7834] },
  { id: 'd2', name: 'Braindead Brewing', icon: '🍺', type: 'Craft Brewery', crowd: 'moderate', pct: 55, dist: '0.6 mi', wait: '~8 min', hasHH: true, hhDeal: '$4 pints + $2 sliders', image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400', coordinates: [32.7847, -96.7822] },
  { id: 'd3', name: 'AllGood Cafe', icon: '☕', type: 'Coffee Shop', crowd: 'quiet', pct: 22, dist: '0.2 mi', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400', coordinates: [32.7839, -96.7808] },
  { id: 'd4', name: 'Katy Trail Ice House', icon: '🍺', type: 'Outdoor Bar', crowd: 'quiet', pct: 19, dist: '1.4 mi', hasHH: true, hhDeal: '$3 domestics', image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400', coordinates: [32.8033, -96.8047] },
  { id: 'd5', name: 'Klyde Warren Park', icon: '🌳', type: 'Public Park', crowd: 'quiet', pct: 28, dist: '0.9 mi', image: 'https://images.unsplash.com/photo-1496564203457-11bb12075d90?w=400', coordinates: [32.7893, -96.8016] },
  { id: 'd6', name: 'Uptown Sushi', icon: '🍣', type: 'Japanese', crowd: 'moderate', pct: 67, dist: '1.2 mi', wait: '~15 min', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400', coordinates: [32.8010, -96.7987] },
  { id: 'd7', name: 'The Rustic', icon: '🎵', type: 'Bar & Live Music', crowd: 'moderate', pct: 62, dist: '1.0 mi', hasHH: true, hhDeal: '$5 wells til 7pm', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400', coordinates: [32.7905, -96.8065] },
  { id: 'd8', name: 'Deep Ellum Brewing', icon: '🍺', type: 'Craft Brewery', crowd: 'busy', pct: 78, dist: '0.5 mi', image: 'https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=400', coordinates: [32.7835, -96.7790] },
];

export const RENO_VENUES: Venue[] = [
  { id: 'r1', name: 'The Depot Craft Brewery', icon: '🍺', type: 'Craft Brewery', crowd: 'moderate', pct: 48, dist: '0.3 mi', hasHH: true, hhDeal: '$5 pints til 6pm', image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400', coordinates: [39.5280, -119.8130] },
  { id: 'r2', name: 'Great Basin Brewing', icon: '🍺', type: 'Brewpub', crowd: 'quiet', pct: 30, dist: '0.7 mi', image: 'https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=400', coordinates: [39.5310, -119.8170] },
  { id: 'r3', name: 'Midtown Eats', icon: '🍔', type: 'American Restaurant', crowd: 'moderate', pct: 55, dist: '0.5 mi', wait: '~10 min', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', coordinates: [39.5250, -119.8110] },
  { id: 'r4', name: 'Riverwalk Coffee', icon: '☕', type: 'Coffee Shop', crowd: 'quiet', pct: 18, dist: '0.2 mi', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400', coordinates: [39.5275, -119.8155] },
  { id: 'r5', name: 'Wingfield Park', icon: '🌳', type: 'Public Park', crowd: 'quiet', pct: 15, dist: '0.4 mi', image: 'https://images.unsplash.com/photo-1496564203457-11bb12075d90?w=400', coordinates: [39.5285, -119.8140] },
  { id: 'r6', name: 'Silver Peak Restaurant', icon: '🍽️', type: 'American Restaurant', crowd: 'busy', pct: 82, dist: '0.6 mi', wait: '25 min', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400', coordinates: [39.5295, -119.8160] },
];

export const DALLAS_THINGS: ThingToDo[] = [
  { id: 't1', name: 'Walk the Katy Trail', icon: '🏃', desc: '3.5 mile urban trail', crowd: 'quiet', image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400', coordinates: [32.8100, -96.8065] },
  { id: 't2', name: 'Bishop Arts District', icon: '🛍️', desc: 'Boutiques & cafes', crowd: 'moderate', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', coordinates: [32.7494, -96.8265] },
  { id: 't3', name: 'Reunion Tower', icon: '📸', desc: 'City views', crowd: 'quiet', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400', coordinates: [32.7755, -96.8088] },
  { id: 't4', name: 'Dallas Farmers Market', icon: '🥬', desc: 'Local vendors', crowd: 'moderate', image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400', coordinates: [32.7827, -96.7922] },
];

export const RENO_THINGS: ThingToDo[] = [
  { id: 'rt1', name: 'Riverwalk District', icon: '🚶', desc: 'Scenic river path', crowd: 'quiet', image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400', coordinates: [39.5270, -119.8145] },
  { id: 'rt2', name: 'Midtown Murals', icon: '🎨', desc: 'Street art walking tour', crowd: 'quiet', image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400', coordinates: [39.5240, -119.8125] },
  { id: 'rt3', name: 'The Arch', icon: '📸', desc: 'Iconic photo op', crowd: 'moderate', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400', coordinates: [39.5297, -119.8138] },
  { id: 'rt4', name: 'Truckee River Walk', icon: '🌊', desc: 'Waterfront stroll', crowd: 'quiet', image: 'https://images.unsplash.com/photo-1496564203457-11bb12075d90?w=400', coordinates: [39.5280, -119.8150] },
];

export function getVenuesForCity(cityId: string): Venue[] {
  return cityId === 'dallas' ? DALLAS_VENUES : RENO_VENUES;
}

export function getThingsForCity(cityId: string): ThingToDo[] {
  return cityId === 'dallas' ? DALLAS_THINGS : RENO_THINGS;
}
