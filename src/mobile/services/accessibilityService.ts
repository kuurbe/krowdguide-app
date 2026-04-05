/**
 * Accessibility data — Wheelmap.org API.
 * Free API, requires registration for key but works without for basic queries.
 */

import { fetchJSON, errorMessage } from './fetchUtil';
import type { AccessibilityNode, LatLng } from '../types';

// ── Wheelmap.org ───────────────────────────────────────────

const WHEELMAP_BASE = 'https://wheelmap.org/api/nodes';

interface WheelmapNode {
  id: number;
  name?: string;
  lat: number;
  lon: number;
  wheelchair: 'yes' | 'limited' | 'no' | 'unknown';
  category?: { identifier?: string };
  node_type?: { identifier?: string };
}

interface WheelmapResponse {
  nodes: WheelmapNode[];
}

/**
 * Fetch wheelchair accessibility data for venues in a bounding box.
 * @param center [lat, lng] center point
 * @param radiusKm approximate radius in km (converts to bbox)
 */
export async function fetchAccessibilityData(
  center: LatLng,
  radiusKm = 1,
): Promise<AccessibilityNode[]> {
  try {
    // Convert center + radius to bounding box
    const latDelta = radiusKm / 111.32; // ~111km per degree latitude
    const lngDelta = radiusKm / (111.32 * Math.cos(center[0] * Math.PI / 180));

    const bbox = [
      center[1] - lngDelta, // west
      center[0] - latDelta, // south
      center[1] + lngDelta, // east
      center[0] + latDelta, // north
    ].join(',');

    const url = `${WHEELMAP_BASE}?bbox=${bbox}&per_page=100&page=1`;
    const data = await fetchJSON<WheelmapResponse>(url, { timeout: 10_000 });

    return (data.nodes ?? []).map(n => ({
      id: `wm-${n.id}`,
      name: n.name ?? undefined,
      coordinates: [n.lat, n.lon] as LatLng,
      wheelchairStatus: n.wheelchair ?? 'unknown',
      category: n.category?.identifier ?? n.node_type?.identifier ?? undefined,
      source: 'wheelmap' as const,
    }));
  } catch (err) {
    if (import.meta.env.DEV) console.error('[Wheelmap]', errorMessage(err));
    return [];
  }
}
