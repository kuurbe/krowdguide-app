import type { Map, LngLatLike } from 'mapbox-gl';

export interface FlyoverWaypoint {
  center: [number, number]; // [lng, lat]
  name: string;
}

interface CameraState {
  center: LngLatLike;
  zoom: number;
  pitch: number;
  bearing: number;
}

/** Wait for map animation to complete */
function waitForMoveEnd(map: Map): Promise<void> {
  return new Promise((resolve) => {
    map.once('moveend', () => resolve());
  });
}

/**
 * Start a cinematic 3D flyover tour through waypoints.
 * Returns a cancel function and calls onWaypointChange with current index.
 */
export function startFlyover(
  map: Map,
  waypoints: FlyoverWaypoint[],
  callbacks: {
    onWaypointChange?: (index: number, waypoint: FlyoverWaypoint) => void;
    onComplete?: () => void;
  } = {}
): () => void {
  let cancelled = false;

  // Save original camera
  const original: CameraState = {
    center: map.getCenter(),
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
  };

  const run = async () => {
    for (let i = 0; i < waypoints.length; i++) {
      if (cancelled) break;
      const wp = waypoints[i];
      callbacks.onWaypointChange?.(i, wp);

      map.flyTo({
        center: wp.center,
        zoom: 16,
        pitch: 60,
        bearing: i * 55, // Rotate per stop for cinematic effect
        duration: i === 0 ? 2500 : 3500,
        essential: true,
      });
      await waitForMoveEnd(map);

      if (cancelled) break;

      // Dwell at each stop briefly
      await new Promise<void>((r) => setTimeout(r, 1200));
    }

    if (!cancelled) {
      // Return to original view
      map.flyTo({
        center: original.center,
        zoom: original.zoom,
        pitch: original.pitch,
        bearing: original.bearing,
        duration: 2000,
        essential: true,
      });
      await waitForMoveEnd(map);
      callbacks.onComplete?.();
    }
  };

  run();

  return () => {
    cancelled = true;
    // Snap back to original
    map.flyTo({
      center: original.center,
      zoom: original.zoom,
      pitch: original.pitch,
      bearing: original.bearing,
      duration: 1000,
    });
  };
}
