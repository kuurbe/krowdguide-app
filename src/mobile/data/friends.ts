/**
 * Mock social graph — friends + their current check-ins.
 * Gated by an opt-in flag in Account settings (future).
 */

export interface Friend {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  neighborhoodId: string | null; // where they are right now
  lastSeen: string; // e.g. "5 min ago"
}

const DALLAS_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Maya',   initials: 'MR', avatarColor: '#ff4d6a', neighborhoodId: 'dal-de', lastSeen: 'now' },
  { id: 'f2', name: 'Jordan', initials: 'JC', avatarColor: '#a855f7', neighborhoodId: 'dal-de', lastSeen: 'now' },
  { id: 'f3', name: 'Alex',   initials: 'AR', avatarColor: '#22d3ee', neighborhoodId: 'dal-up', lastSeen: '12m ago' },
  { id: 'f4', name: 'Taylor', initials: 'TW', avatarColor: '#fbbf24', neighborhoodId: 'dal-ba', lastSeen: 'now' },
  { id: 'f5', name: 'Chris',  initials: 'CL', avatarColor: '#34d399', neighborhoodId: 'dal-kn', lastSeen: '28m ago' },
];

const RENO_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Maya',   initials: 'MR', avatarColor: '#ff4d6a', neighborhoodId: 'ren-dr', lastSeen: 'now' },
  { id: 'f2', name: 'Jordan', initials: 'JC', avatarColor: '#a855f7', neighborhoodId: 'ren-mt', lastSeen: 'now' },
  { id: 'f3', name: 'Alex',   initials: 'AR', avatarColor: '#22d3ee', neighborhoodId: 'ren-dr', lastSeen: '8m ago' },
  { id: 'f4', name: 'Taylor', initials: 'TW', avatarColor: '#fbbf24', neighborhoodId: 'ren-ad', lastSeen: 'now' },
];

export function getFriendsForCity(cityId: string): Friend[] {
  if (cityId === 'dallas') return DALLAS_FRIENDS;
  if (cityId === 'reno') return RENO_FRIENDS;
  return [];
}

/** Group friends by the neighborhood they're currently in */
export function friendsByNeighborhood(friends: Friend[]): Map<string, Friend[]> {
  const m = new Map<string, Friend[]>();
  for (const f of friends) {
    if (!f.neighborhoodId) continue;
    const list = m.get(f.neighborhoodId) ?? [];
    list.push(f);
    m.set(f.neighborhoodId, list);
  }
  return m;
}
