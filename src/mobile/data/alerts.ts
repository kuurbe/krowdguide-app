import type { Alert } from '../types';

export const DALLAS_ALERTS: Alert[] = [
  { id: '1', icon: '🚨', title: 'Deep Ellum crowd rising fast', tag: 'spike', text: 'Crowd up 22% in 30 min on Main St. Parking near full.', loc: 'Deep Ellum · 0.8 mi', time: '4 min ago', up: 28, dn: 3, trusted: true },
  { id: '2', icon: '🍺', title: 'Happy Hour live at Braindead', tag: 'hh', text: '$4 pints and $2 sliders now active. Bar stools open.', loc: 'Deep Ellum · 0.6 mi', time: '8 min ago', up: 19, dn: 1 },
  { id: '3', icon: '🛒', title: 'Tom Thumb: Moderate checkout lines', tag: 'grocery', text: 'Self-checkout ~6 min wait. Staffed lanes faster.', loc: 'Lower Greenville · 2.1 mi', time: '13 min ago', up: 24, dn: 4 },
  { id: '4', icon: '🌳', title: 'Klyde Warren: Open and quiet', tag: 'park', text: 'Park only 28% full. Food trucks zero queue.', loc: 'Uptown · 0.9 mi', time: '18 min ago', up: 41, dn: 2 },
  { id: '5', icon: '🍖', title: 'Pecan Lodge: 45-min walk-in wait', tag: 'food', text: 'Walk-in wait at 45 min and growing. Order online.', loc: 'Deep Ellum · 0.4 mi', time: '22 min ago', up: 35, dn: 6 },
  { id: '6', icon: '🚌', title: 'DART Green Line on schedule', tag: 'transit', text: 'Green Line running on time. Platform clear.', loc: 'Downtown · 1.2 mi', time: '30 min ago', up: 17, dn: 0 },
];

export const RENO_ALERTS: Alert[] = [
  { id: 'r1', icon: '🎰', title: 'Downtown casinos moderate', tag: 'spike', text: 'Virginia St casinos at 60% capacity. Good time to visit.', loc: 'Downtown · 0.3 mi', time: '5 min ago', up: 15, dn: 2, trusted: true },
  { id: 'r2', icon: '🍺', title: 'Happy Hour at The Depot', tag: 'hh', text: '$5 pints until 6pm. Patio seats available.', loc: 'Midtown · 0.4 mi', time: '10 min ago', up: 12, dn: 1 },
  { id: 'r3', icon: '🌳', title: 'Wingfield Park is empty', tag: 'park', text: 'Park nearly empty. Great for a walk.', loc: 'Midtown · 0.4 mi', time: '20 min ago', up: 22, dn: 0 },
  { id: 'r4', icon: '🍔', title: 'Silver Peak: 25-min wait', tag: 'food', text: 'Dinner rush starting. Consider takeout.', loc: 'Downtown · 0.6 mi', time: '15 min ago', up: 18, dn: 3 },
];

export function getAlertsForCity(cityId: string): Alert[] {
  return cityId === 'dallas' ? DALLAS_ALERTS : RENO_ALERTS;
}
