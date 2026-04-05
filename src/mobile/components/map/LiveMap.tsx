import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppContext } from '../../context';
import { MAPBOX_TOKEN } from '../../config/mapbox';
import { MapSearchBar } from './MapSearchBar';
import { NavigationOverlay } from './NavigationOverlay';
import type { Venue } from '../../types';
import { Navigation } from 'lucide-react';
import { formatDistance } from '../../services/directionsService';

mapboxgl.accessToken = MAPBOX_TOKEN;

/** Set up POI interactions using Mapbox Standard style's built-in featuresets (v3.9+).
 *  Catches taps on POIs AND place labels — opens Apple Maps-style bottom sheet. */
function setupPOIInteractions(
  map: mapboxgl.Map,
  onPOITap: (name: string, group: string, coords: [number, number]) => void,
) {
  const handler = (e: any) => {
    const name: string = e.feature?.properties?.name || 'Unknown Place';
    const group: string = e.feature?.properties?.group || e.feature?.properties?.class || '';
    const coords = e.feature?.geometry?.coordinates as [number, number] | undefined;
    if (!coords) return true;
    try { (map as any).setFeatureState(e.feature, { highlight: true }); } catch { /* no-op */ }
    onPOITap(name, group, coords);
    return true;
  };
  const cursorIn = () => { map.getCanvas().style.cursor = 'pointer'; return true; };
  const cursorOut = () => { map.getCanvas().style.cursor = ''; return true; };

  try {
    // POI featureset — businesses, restaurants, shops, etc.
    (map as any).addInteraction('kg-poi-click', {
      type: 'click',
      target: { featuresetId: 'poi', importId: 'basemap' },
      handler,
    });
    (map as any).addInteraction('kg-poi-hover', {
      type: 'mouseenter',
      target: { featuresetId: 'poi', importId: 'basemap' },
      handler: cursorIn,
    });
    (map as any).addInteraction('kg-poi-hover-leave', {
      type: 'mouseleave',
      target: { featuresetId: 'poi', importId: 'basemap' },
      handler: cursorOut,
    });

    // Place-labels featureset — landmarks, parks, neighborhoods, schools, etc.
    try {
      (map as any).addInteraction('kg-place-click', {
        type: 'click',
        target: { featuresetId: 'place-labels', importId: 'basemap' },
        handler,
      });
      (map as any).addInteraction('kg-place-hover', {
        type: 'mouseenter',
        target: { featuresetId: 'place-labels', importId: 'basemap' },
        handler: cursorIn,
      });
      (map as any).addInteraction('kg-place-hover-leave', {
        type: 'mouseleave',
        target: { featuresetId: 'place-labels', importId: 'basemap' },
        handler: cursorOut,
      });
    } catch { /* place-labels featureset may not exist in all style versions */ }
  } catch (err) {
    // Fallback for GL JS < 3.9
    if (import.meta.env.DEV) console.warn('[KG] addInteraction unavailable, using legacy handler:', err);
    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point);
      const poi = features.find((f: any) =>
        f.sourceLayer === 'poi_label' || f.sourceLayer === 'place_label' ||
        f.layer?.id?.includes('poi') || f.layer?.id?.includes('place'));
      if (!poi) return;
      const name = poi.properties?.name || 'Unknown Place';
      const group = poi.properties?.class || poi.properties?.category_en || '';
      const coords = (poi.geometry as GeoJSON.Point).coordinates as [number, number];
      onPOITap(name, group, coords);
    });
  }
}

/** Get time-based light preset for Mapbox Standard style */
function getTimePreset(): 'dawn' | 'day' | 'dusk' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

const CATEGORY_MAP: Record<string, string[]> = {
  'All': [],
  '\u{1F374} Food': ['Restaurant', 'BBQ', 'Japanese', 'American'],
  '\u2615 Coffee': ['Coffee'],
  '\u{1F37A} Bars': ['Brewery', 'Bar', 'Brewpub'],
  '\u{1F33F} Parks': ['Park'],
};

function buildGeoJSON(venues: Venue[], favorites?: Set<string>) {
  return {
    type: 'FeatureCollection' as const,
    features: venues.map(v => ({
      type: 'Feature' as const,
      properties: {
        id: v.id, name: v.name, pct: v.pct, crowd: v.crowd, weight: v.pct / 100,
        icon: v.icon || '', fav: favorites?.has(v.id) ? 1 : 0,
      },
      geometry: { type: 'Point' as const, coordinates: [v.coordinates[1], v.coordinates[0]] },
    })),
  };
}

export function LiveMap({ onKGClick, onSearchResults }: { onKGClick?: () => void; onSearchResults?: (venues: import('../../types').Venue[]) => void }) {
  const { selectedCity, theme, mapRef, directions, startDirections, advanceStep, venues, venueById, highlightedVenueId, setHighlightedVenueId, selectVenue: ctxSelectVenue, selectPOI, favorites } = useAppContext();
  const [activeCategory, setActiveCategory] = useState('All');
  const [mapLoaded, setMapLoaded] = useState(false);
  // pulseFrameRef removed — no more pulse animation

  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const initThemeRef = useRef(theme);
  const filteredVenues = useMemo(() => {
    if (activeCategory === 'All') return venues;
    const kw = CATEGORY_MAP[activeCategory] || [];
    return venues.filter(v => kw.some(k => v.type.toLowerCase().includes(k.toLowerCase())));
  }, [venues, activeCategory]);

  const selectVenue = useCallback((venue: Venue) => {
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    ctxSelectVenue(venue);
  }, [ctxSelectVenue]);

  // 1. Create map — Mapbox Standard style with 3D buildings, terrain, globe
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [selectedCity.coordinates[1], selectedCity.coordinates[0]],
      zoom: Math.max(selectedCity.zoom, 14),
      pitch: 0,
      attributionControl: false,
      projection: 'mercator' as any,
    });

    // Apply initial theme via Standard light preset (style.load fires before load)
    map.on('style.load', () => {
      const isDark = initThemeRef.current === 'dark';
      try {
        (map as any).setConfigProperty('basemap', 'lightPreset', isDark ? 'night' : 'day');
        (map as any).setConfigProperty('basemap', 'showPointOfInterestLabels', true);
        (map as any).setConfigProperty('basemap', 'showTransitLabels', true);
      } catch { /* Standard config not available */ }
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }), 'bottom-right');

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
      showAccuracyCircle: false,
    });
    map.addControl(geolocate, 'bottom-right');

    // Wait for full load (all resources ready) before adding custom layers
    map.on('load', () => {
      setupPOIInteractions(map, (name, group, coords) => {
        selectPOI({ name, group, coordinates: coords });
      });

      setMapLoaded(true);
      setTimeout(() => geolocate.trigger(), 500);
    });

    mapRef.current = map;

    // Auto lightPreset interval — update every 15 minutes (dark mode only)
    const lightPresetInterval = setInterval(() => {
      if (prevThemeRef.current === 'dark' && mapRef.current) {
        try {
          (mapRef.current as any).setConfigProperty('basemap', 'lightPreset', getTimePreset());
        } catch { /* no-op */ }
      }
    }, 15 * 60 * 1000);

    return () => {
      clearInterval(lightPresetInterval);
      map.remove();
      mapRef.current = null;
    };
  }, [mapRef, startDirections]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Theme changes — use Standard lightPreset instead of full style swap
  const prevThemeRef = useRef(theme);
  useEffect(() => {
    if (prevThemeRef.current === theme) return;
    prevThemeRef.current = theme;
    const map = mapRef.current;
    if (!map) return;
    const isDark = theme === 'dark';
    try {
      (map as any).setConfigProperty('basemap', 'lightPreset', isDark ? 'night' : 'day');
    } catch { /* fallback: no-op if Standard config unavailable */ }
    // Standard style handles building colors via lightPreset
    // Standard style automatically handles POI label colors via lightPreset
  }, [theme]);

  // 3. City changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [selectedCity.coordinates[1], selectedCity.coordinates[0]], zoom: Math.max(selectedCity.zoom, 14), duration: 1200 });
  }, [selectedCity]);

  // 4. Category changes — filter KrowdGuide venue dots (Standard POIs always visible)
  // The Standard style's built-in POI labels are always shown; category filtering
  // only affects our custom KrowdGuide venue overlay (crowd-points, crowd-venue-icons).
  // This is handled automatically via filteredVenues in the heatmap effect.

  // 6. Heatmap — subtle glow BEHIND poi labels, not covering them
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    let cancelled = false;
    let clickHandler: ((e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => void) | null = null;

    function addLayers() {
      if (cancelled || !map) return;
      const geojson = buildGeoJSON(filteredVenues, favorites);

      // Clean up previous layers including pulse rings, icons, and fav hearts
      clearInterval((map as any)?._kgPulseTimer);
      ['crowd-venue-icons', 'crowd-fav-hearts', 'crowd-heat', 'crowd-points'].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource('venues')) map.removeSource('venues');

      map.addSource('venues', { type: 'geojson', data: geojson });

      map.addLayer({
        id: 'crowd-heat',
        type: 'heatmap',
        source: 'venues',
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0.2, 0.5, 0.5, 1, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 14, 1.5, 16, 2],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 30, 13, 50, 15, 70, 17, 90],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.15, 'rgba(52,211,153,0.2)',
            0.3, 'rgba(52,211,153,0.35)',
            0.5, 'rgba(250,204,21,0.35)',
            0.7, 'rgba(245,158,11,0.4)',
            0.85, 'rgba(255,77,106,0.45)',
            1, 'rgba(255,77,106,0.55)',
          ],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 14, 0.4, 17, 0.25],
        },
      });

      // Circle points for KrowdGuide venues — simple dots, no pulse animation
      map.addLayer({
        id: 'crowd-points',
        type: 'circle',
        source: 'venues',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 14, 8, 16, 11],
          'circle-color': [
            'match', ['get', 'crowd'],
            'quiet', '#34d399',
            'moderate', '#fbbf24',
            'busy', '#ff4d6a',
            '#ffffff',
          ],
          'circle-opacity': 0.9,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': 'rgba(255,255,255,0.4)',
          'circle-stroke-opacity': 0.8,
        },
      });

      // Venue emoji icon labels — floating above the dot
      map.addLayer({
        id: 'crowd-venue-icons',
        type: 'symbol',
        source: 'venues',
        minzoom: 13,
        layout: {
          'text-field': ['get', 'icon'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 13, 14, 15, 18, 17, 22],
          'text-offset': [0, -1.4],
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 13.5, 1],
        },
      });

      // Favorite heart badges — small ❤️ offset top-right of favorited venues
      map.addLayer({
        id: 'crowd-fav-hearts',
        type: 'symbol',
        source: 'venues',
        minzoom: 13,
        filter: ['==', ['get', 'fav'], 1],
        layout: {
          'text-field': '❤️',
          'text-size': ['interpolate', ['linear'], ['zoom'], 13, 8, 15, 11, 17, 13],
          'text-offset': [0.8, -2.2],
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 13.5, 1],
        },
      });

      // Click circle points → open KrowdGuide VenueDetailSheet + highlight for map→list sync
      clickHandler = (e) => {
        if (!e.features?.length) return;
        const venueId = e.features[0].properties?.id;
        const venue = venueById.get(venueId) || filteredVenues.find(v => v.id === venueId);
        if (venue) {
          selectVenue(venue);
          setHighlightedVenueId(venue.id);
          setTimeout(() => setHighlightedVenueId(null), 5000);
        }
      };

      map.on('click', 'crowd-points', clickHandler);
      map.on('mouseenter', 'crowd-points', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'crowd-points', () => { map.getCanvas().style.cursor = ''; });
    }

    // Mapbox Standard style may report isStyleLoaded()=false even after 'load' event
    // (it lazily loads sub-resources). We already guard with mapLoaded which is set
    // inside map.on('load'). Just try to add layers — if the style isn't ready yet,
    // retry a few times with setTimeout backoff.
    function tryAddLayers(attempt = 0) {
      if (cancelled) return;
      try {
        addLayers();
      } catch {
        if (attempt < 5) {
          setTimeout(() => tryAddLayers(attempt + 1), 500 * (attempt + 1));
        }
      }
    }
    tryAddLayers();

    return () => {
      cancelled = true;
      clearInterval((map as any)?._kgPulseTimer);
      if (clickHandler && map) map.off('click', 'crowd-points', clickHandler);
    };
  }, [mapLoaded, filteredVenues, selectVenue, venueById, favorites]);

  // 6b. Highlighted venue — enlarge + white ring on map when highlightedVenueId set
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.getLayer('crowd-points')) return;

    if (highlightedVenueId) {
      map.setPaintProperty('crowd-points', 'circle-radius', [
        'case',
        ['==', ['get', 'id'], highlightedVenueId],
        14,
        ['interpolate', ['linear'], ['zoom'], 10, 4, 14, 8, 16, 11],
      ]);
      map.setPaintProperty('crowd-points', 'circle-stroke-width', [
        'case',
        ['==', ['get', 'id'], highlightedVenueId],
        4,
        2.5,
      ]);
      map.setPaintProperty('crowd-points', 'circle-stroke-color', [
        'case',
        ['==', ['get', 'id'], highlightedVenueId],
        '#ffffff',
        'rgba(255,255,255,0.4)',
      ]);
    } else {
      // Reset to defaults
      map.setPaintProperty('crowd-points', 'circle-radius', ['interpolate', ['linear'], ['zoom'], 10, 4, 14, 8, 16, 11]);
      map.setPaintProperty('crowd-points', 'circle-stroke-width', 2.5);
      map.setPaintProperty('crowd-points', 'circle-stroke-color', 'rgba(255,255,255,0.4)');
    }
  }, [highlightedVenueId, mapLoaded]);

  // 7. Route rendering — draw directions polyline on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.isStyleLoaded()) return;

    // Clean up previous route layers
    const routeLayers = ['directions-route', 'directions-dest-dot', 'directions-origin-dot', 'directions-origin-pulse'];
    const routeSources = ['directions-route', 'directions-dest', 'directions-origin'];
    routeLayers.forEach(l => { if (map.getLayer(l)) map.removeLayer(l); });
    routeSources.forEach(s => { if (map.getSource(s)) map.removeSource(s); });

    if (!directions.route || !directions.active) return;

    // Route line — Google Maps style: blue with darker casing
    map.addSource('directions-route', {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: directions.route.geometry },
    });

    // Outer casing (dark blue shadow)
    map.addLayer({
      id: 'directions-route',
      type: 'line',
      source: 'directions-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#ff4d6a',
        'line-width': 7,
        'line-border-width': 1.5,
        'line-border-color': '#cc3d55',
        'line-opacity': 0.95,
      },
    });

    // Origin marker — Google style green circle
    if (directions.origin) {
      map.addSource('directions-origin', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: directions.origin } },
      });
      map.addLayer({
        id: 'directions-origin-pulse',
        type: 'circle',
        source: 'directions-origin',
        paint: { 'circle-radius': 12, 'circle-color': '#34d399', 'circle-opacity': 0.2 },
      });
      map.addLayer({
        id: 'directions-origin-dot',
        type: 'circle',
        source: 'directions-origin',
        paint: { 'circle-radius': 6, 'circle-color': '#34d399', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#ffffff' },
      });
    }

    // Destination marker — red pin style
    if (directions.destination) {
      map.addSource('directions-dest', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: directions.destination.coords } },
      });
      map.addLayer({
        id: 'directions-dest-dot',
        type: 'circle',
        source: 'directions-dest',
        paint: { 'circle-radius': 7, 'circle-color': '#ff4d6a', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#ffffff' },
      });
    }

    // Fit bounds — Apple/Google style padding (more top for header, more bottom for drawer)
    const coords = directions.route.geometry.coordinates as [number, number][];
    const bounds = coords.reduce(
      (b, c) => b.extend(c as mapboxgl.LngLatLike),
      new mapboxgl.LngLatBounds(coords[0], coords[0])
    );
    map.fitBounds(bounds, {
      padding: { top: 100, bottom: 350, left: 50, right: 50 },
      duration: 1000,
      maxZoom: 16,
    });

    return () => {
      routeLayers.forEach(l => { if (map.getLayer(l)) map.removeLayer(l); });
      routeSources.forEach(s => { if (map.getSource(s)) map.removeSource(s); });
    };
  }, [directions.route, directions.active, directions.destination, directions.origin, mapLoaded, mapRef]);

  // 7b. Navigation mode — highlight current/completed segments + camera control
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.isStyleLoaded()) return;

    // Layers for navigation mode
    const navLayers = ['directions-completed', 'directions-active-step'];
    const navSources = ['directions-completed', 'directions-current-segment'];

    const EMPTY_LINE: GeoJSON.Feature = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } };
    const EMPTY_MULTI: GeoJSON.Feature = { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: [] } };

    if (!directions.navigating || !directions.route) {
      // Restore state when not navigating
      if (map.getLayer('directions-route')) map.setPaintProperty('directions-route', 'line-opacity', 0.95);
      // Buildings handled by Standard style
      ['crowd-heat', 'crowd-venue-icons', 'crowd-fav-hearts'].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible');
      });
      try { (map as any).setConfigProperty('basemap', 'showPointOfInterestLabels', true); } catch { /* no-op */ }
      // Clear nav layers without removing them — just empty data
      const completedSrc = map.getSource('directions-completed') as mapboxgl.GeoJSONSource;
      if (completedSrc) completedSrc.setData(EMPTY_MULTI);
      const currentSrc = map.getSource('directions-current-segment') as mapboxgl.GeoJSONSource;
      if (currentSrc) currentSrc.setData(EMPTY_LINE);
      return;
    }

    // Navigation mode — Standard handles buildings

    const { steps } = directions.route;
    const idx = directions.currentStepIndex;
    if (idx >= steps.length) return;

    // Dim main route + hide crowd overlays
    if (map.getLayer('directions-route')) map.setPaintProperty('directions-route', 'line-opacity', 0.3);
    ['crowd-heat', 'crowd-venue-icons', 'crowd-fav-hearts'].forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
    });
    try { (map as any).setConfigProperty('basemap', 'showPointOfInterestLabels', false); } catch { /* no-op */ }

    // Completed segments — use setData if source exists, else create
    const completedCoords: GeoJSON.Position[][] = [];
    for (let i = 0; i < idx; i++) {
      if (steps[i].geometry?.coordinates) completedCoords.push(steps[i].geometry.coordinates);
    }
    const completedData: GeoJSON.Feature = {
      type: 'Feature', properties: {},
      geometry: { type: 'MultiLineString', coordinates: completedCoords },
    };

    const existingCompleted = map.getSource('directions-completed') as mapboxgl.GeoJSONSource;
    if (existingCompleted) {
      existingCompleted.setData(completedData);
    } else {
      map.addSource('directions-completed', { type: 'geojson', data: completedData });
      map.addLayer({
        id: 'directions-completed', type: 'line', source: 'directions-completed',
        paint: { 'line-color': '#64748b', 'line-width': 5, 'line-opacity': 0.4 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });
    }

    // Current segment — use setData if source exists, else create
    const currentStep = steps[idx];
    const currentData: GeoJSON.Feature = currentStep.geometry?.coordinates
      ? { type: 'Feature', properties: {}, geometry: currentStep.geometry }
      : EMPTY_LINE;

    const existingCurrent = map.getSource('directions-current-segment') as mapboxgl.GeoJSONSource;
    if (existingCurrent) {
      existingCurrent.setData(currentData);
    } else {
      map.addSource('directions-current-segment', { type: 'geojson', data: currentData });
      map.addLayer({
        id: 'directions-active-step', type: 'line', source: 'directions-current-segment',
        paint: { 'line-color': '#ff4d6a', 'line-width': 7, 'line-opacity': 1, 'line-border-width': 1.5, 'line-border-color': '#cc3d55' },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });
    }

    // Camera — fit the full remaining route in view (overview), then track via GPS
    if (idx === 0 && currentStep.geometry?.coordinates) {
      // On first step, show overview of entire route
      const allCoords = steps.flatMap(s => s.geometry?.coordinates || []);
      if (allCoords.length > 1) {
        const lngs = allCoords.map(c => c[0]);
        const lats = allCoords.map(c => c[1]);
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: { top: 120, bottom: 200, left: 40, right: 40 }, duration: 1000 }
        );
      }
    } else if (currentStep.geometry?.coordinates) {
      // On subsequent steps, ease to maneuver point with bearing
      const coords = currentStep.geometry.coordinates;
      const maneuverPoint = coords[0];
      map.easeTo({
        center: maneuverPoint as [number, number],
        bearing: currentStep.maneuver.bearing_after ?? map.getBearing(),
        zoom: 16.5, duration: 1200,
      });
    }

    // GPS tracking — watch position and auto-advance steps
    let watchId: number | null = null;
    if (directions.navigating && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const userLng = pos.coords.longitude;
          const userLat = pos.coords.latitude;

          // Smooth camera follow user position with heading
          const heading = pos.coords.heading;
          map.easeTo({
            center: [userLng, userLat],
            ...(heading != null && !isNaN(heading) ? { bearing: heading } : {}),
            zoom: 16.5,
            duration: 800,
          });

          // Auto-advance: check distance to end of current step geometry
          if (idx < steps.length) {
            const stepCoords = steps[idx]?.geometry?.coordinates;
            if (stepCoords && stepCoords.length > 0) {
              const endPoint = stepCoords[stepCoords.length - 1];
              const dLat = endPoint[1] - userLat;
              const dLng = endPoint[0] - userLng;
              const distMeters = Math.sqrt(dLat * dLat + dLng * dLng) * 111320;
              if (distMeters < 30) {
                advanceStep();
              }
            }
          }
        },
        () => { /* GPS error — continue without tracking */ },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
      );
    }

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      navLayers.forEach(l => { if (map.getLayer(l)) map.removeLayer(l); });
      navSources.forEach(s => { if (map.getSource(s)) map.removeSource(s); });
    };
  }, [directions.navigating, directions.currentStepIndex, directions.route, mapLoaded, mapRef, advanceStep]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {/* Search bar with integrated category filter toggle — hidden during navigation */}
      {!directions.navigating && (
        <MapSearchBar
          venues={venues}
          onVenueSelect={selectVenue}
          onKGClick={onKGClick}
          onSearchResults={onSearchResults}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      )}
      {/* Floating step card — shows first step in preview mode only */}
      {directions.active && !directions.navigating && directions.route && directions.route.steps.length > 0 && (
        <div className="absolute bottom-[180px] left-4 right-4 z-[200]">
          <div className="liquid-glass rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff4d6a]/15 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-5 h-5 text-[#ff4d6a]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#ff4d6a] font-bold uppercase tracking-wider">
                {formatDistance(directions.route.steps[0].distance)}
              </p>
              <p className="text-[14px] text-white font-semibold truncate">{directions.route.steps[0].instruction}</p>
            </div>
          </div>
        </div>
      )}
      {/* Active navigation overlay */}
      <NavigationOverlay />
    </div>
  );
}
