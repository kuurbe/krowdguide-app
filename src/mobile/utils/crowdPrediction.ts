import type { Venue } from '../types';

export interface CrowdDataPoint {
  hour: number;
  crowd: number;
  label: string;
}

/**
 * Base demand curves by venue type (0–1 scale).
 * Bars peak late evening, coffee peaks morning, parks peak afternoon,
 * restaurants peak lunch + dinner.
 */
const DEMAND_CURVES: Record<string, number[]> = {
  bar: [
    0.02, 0.01, 0.01, 0.01, 0.01, 0.02, 0.03, 0.05, 0.08, 0.12, 0.15, 0.18,
    0.20, 0.22, 0.25, 0.30, 0.38, 0.50, 0.62, 0.75, 0.88, 0.95, 1.00, 0.70,
  ],
  restaurant: [
    0.02, 0.01, 0.01, 0.01, 0.01, 0.03, 0.05, 0.15, 0.30, 0.40, 0.45, 0.65,
    0.85, 0.70, 0.45, 0.30, 0.35, 0.50, 0.75, 0.90, 0.80, 0.55, 0.30, 0.10,
  ],
  coffee: [
    0.01, 0.01, 0.01, 0.01, 0.02, 0.10, 0.35, 0.70, 0.95, 1.00, 0.85, 0.65,
    0.55, 0.50, 0.55, 0.50, 0.40, 0.30, 0.20, 0.10, 0.05, 0.02, 0.01, 0.01,
  ],
  park: [
    0.01, 0.01, 0.01, 0.01, 0.01, 0.03, 0.08, 0.15, 0.30, 0.50, 0.65, 0.80,
    0.85, 0.90, 1.00, 0.95, 0.85, 0.70, 0.50, 0.30, 0.15, 0.05, 0.02, 0.01,
  ],
  default: [
    0.02, 0.01, 0.01, 0.01, 0.02, 0.05, 0.10, 0.20, 0.35, 0.50, 0.60, 0.70,
    0.75, 0.72, 0.65, 0.60, 0.58, 0.62, 0.70, 0.65, 0.50, 0.35, 0.18, 0.08,
  ],
};

/** Simple deterministic hash from venue id for consistent jitter */
function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Deterministic pseudo-random from seed + index (0–1) */
function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed * 9301 + index * 49297) * 49297;
  return x - Math.floor(x);
}

function resolveVenueCategory(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('bar') || t.includes('lounge') || t.includes('club') || t.includes('brewery') || t.includes('pub'))
    return 'bar';
  if (t.includes('restaurant') || t.includes('grill') || t.includes('bistro') || t.includes('diner') || t.includes('kitchen'))
    return 'restaurant';
  if (t.includes('coffee') || t.includes('café') || t.includes('cafe') || t.includes('tea') || t.includes('bakery'))
    return 'coffee';
  if (t.includes('park') || t.includes('garden') || t.includes('trail') || t.includes('outdoor'))
    return 'park';
  return 'default';
}

const HOUR_LABELS = [
  '12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a',
  '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p',
];

/**
 * Generate synthetic 24-hour crowd prediction data from venue properties.
 * Results are deterministic per venue id — consistent across renders.
 */
export function generateCrowdPrediction(venue: Venue): CrowdDataPoint[] {
  const category = resolveVenueCategory(venue.type);
  const curve = DEMAND_CURVES[category] ?? DEMAND_CURVES.default;
  const seed = hashSeed(venue.id);
  const scale = venue.pct / 100; // 0–1

  return curve.map((base, hour) => {
    // Jitter ±12% for natural variation, seeded by venue id
    const jitter = (seededRandom(seed, hour) - 0.5) * 0.24;
    const raw = (base + jitter) * scale;
    const crowd = Math.max(2, Math.min(100, Math.round(raw * 100)));
    return { hour, crowd, label: HOUR_LABELS[hour] };
  });
}

/**
 * Find the best 2-hour window to visit (lowest average crowd)
 * during reasonable hours (10am–10pm).
 */
export function getBestTimeToVisit(data: CrowdDataPoint[]): { startHour: number; endHour: number; label: string } {
  let bestStart = 10;
  let bestAvg = Infinity;

  // Scan windows from 10am (index 10) to 8pm (index 20) — 2h window ending at 10pm
  for (let start = 10; start <= 20; start++) {
    const avg = (data[start].crowd + data[start + 1].crowd) / 2;
    if (avg < bestAvg) {
      bestAvg = avg;
      bestStart = start;
    }
  }

  const fmt = (h: number) => {
    if (h === 0 || h === 24) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  return {
    startHour: bestStart,
    endHour: bestStart + 2,
    label: `${fmt(bestStart)}–${fmt(bestStart + 2)}`,
  };
}

/** Current hour index (0–23) */
export function getCurrentHourIndex(): number {
  return new Date().getHours();
}

/** Day label from 0=Sun through 6=Sat */
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getDayLabel(day: number): string {
  return DAY_LABELS[day] ?? 'Mon';
}

export function getCurrentDayIndex(): number {
  return new Date().getDay();
}
