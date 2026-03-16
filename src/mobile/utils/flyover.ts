import type { Map, LngLatLike } from 'mapbox-gl';

export interface FlyoverWaypoint {
  center: [number, number]; // [lng, lat]
  name: string;
}

export type FlyoverPhase = 'idle' | 'globe' | 'overview' | 'touring' | 'returning';

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

/** Delay with cancellation support */
function delay(ms: number, signal: { cancelled: boolean }): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    const check = setInterval(() => {
      if (signal.cancelled) { clearTimeout(t); clearInterval(check); resolve(); }
    }, 50);
  });
}

/** Smooth bearing orbit using requestAnimationFrame */
function orbitCamera(map: Map, durationMs: number, degreesPerFrame: number, signal: { cancelled: boolean }): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    function frame() {
      if (signal.cancelled || performance.now() - start > durationMs) { resolve(); return; }
      map.setBearing(map.getBearing() + degreesPerFrame);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

/**
 * Multi-phase cinematic 3D flyover:
 * Phase A — Globe zoom-in (dramatic satellite-to-city reveal)
 * Phase B — City overview sweep (360° orbit at city center)
 * Phase C — Venue tour (sweep to each venue with orbit dwell)
 * Phase D — Ascend & return
 */
export function startFlyover(
  map: Map,
  waypoints: FlyoverWaypoint[],
  callbacks: {
    onWaypointChange?: (index: number, waypoint: FlyoverWaypoint) => void;
    onPhaseChange?: (phase: FlyoverPhase) => void;
    onComplete?: () => void;
  } = {}
): () => void {
  const signal = { cancelled: false };

  // Save original camera
  const original: CameraState = {
    center: map.getCenter(),
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
  };

  // Compute city center from waypoints
  const avgLng = waypoints.reduce((s, w) => s + w.center[0], 0) / waypoints.length;
  const avgLat = waypoints.reduce((s, w) => s + w.center[1], 0) / waypoints.length;
  const cityCenter: [number, number] = [avgLng, avgLat];

  const run = async () => {
    // ═══ Phase A — Globe Zoom-In (3s) ═══
    callbacks.onPhaseChange?.('globe');

    // Pull way out to show globe
    map.jumpTo({ center: cityCenter, zoom: 3, pitch: 0, bearing: 0 });
    await delay(300, signal);
    if (signal.cancelled) return;

    // Dramatic fly-in from globe to city
    map.flyTo({
      center: cityCenter,
      zoom: 14.5,
      pitch: 55,
      bearing: -20,
      duration: 3500,
      essential: true,
    });
    await waitForMoveEnd(map);
    if (signal.cancelled) return;

    // ═══ Phase B — City Overview Sweep (5s orbit) ═══
    callbacks.onPhaseChange?.('overview');
    callbacks.onWaypointChange?.(-1, { center: cityCenter, name: 'City Overview' });

    // Zoom in slightly and orbit
    map.easeTo({
      center: cityCenter,
      zoom: 15,
      pitch: 60,
      duration: 1000,
      essential: true,
    });
    await waitForMoveEnd(map);
    if (signal.cancelled) return;

    // Smooth 360-ish orbit for cinematic sweep
    await orbitCamera(map, 5000, 0.35, signal);
    if (signal.cancelled) return;

    // ═══ Phase C — Venue Tour (4s per venue) ═══
    callbacks.onPhaseChange?.('touring');

    for (let i = 0; i < waypoints.length; i++) {
      if (signal.cancelled) break;
      const wp = waypoints[i];
      callbacks.onWaypointChange?.(i, wp);

      // Sweep in from bearing offset
      const targetBearing = map.getBearing() + 45;
      map.flyTo({
        center: wp.center,
        zoom: 17,
        pitch: 70,
        bearing: targetBearing,
        duration: i === 0 ? 2500 : 3000,
        essential: true,
      });
      await waitForMoveEnd(map);
      if (signal.cancelled) break;

      // Slow orbit dwell at venue
      await orbitCamera(map, 1500, 0.25, signal);
      if (signal.cancelled) break;
    }

    if (signal.cancelled) return;

    // ═══ Phase D — Ascend & Return (3s) ═══
    callbacks.onPhaseChange?.('returning');

    // Pull back to city overview first
    map.flyTo({
      center: cityCenter,
      zoom: 14,
      pitch: 45,
      bearing: 0,
      duration: 2000,
      essential: true,
    });
    await waitForMoveEnd(map);
    if (signal.cancelled) return;

    // Return to original camera
    map.flyTo({
      center: original.center,
      zoom: original.zoom,
      pitch: original.pitch,
      bearing: original.bearing,
      duration: 1500,
      essential: true,
    });
    await waitForMoveEnd(map);

    callbacks.onPhaseChange?.('idle');
    callbacks.onComplete?.();
  };

  run();

  return () => {
    signal.cancelled = true;
    callbacks.onPhaseChange?.('idle');
    map.flyTo({
      center: original.center,
      zoom: original.zoom,
      pitch: original.pitch,
      bearing: original.bearing,
      duration: 1000,
    });
  };
}
