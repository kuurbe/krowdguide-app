import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppContext } from '../../context';
import { MAPBOX_TOKEN } from '../../config/mapbox';
import { MapSearchBar } from './MapSearchBar';
import { CategoryPills } from './CategoryPills';
import { MapLegend } from './MapLegend';
import { FlyoverOverlay } from './FlyoverOverlay';
import { NavigationOverlay } from './NavigationOverlay';
import type { Venue } from '../../types';
import { Navigation } from 'lucide-react';
import { formatDistance } from '../../services/directionsService';

mapboxgl.accessToken = MAPBOX_TOKEN;

/** Set up custom POI layers — uses streets-v8 vector source for Standard style compatibility */
function setupPOILayers(map: mapboxgl.Map, popupRef: React.MutableRefObject<mapboxgl.Popup | null>, isDark: boolean) {
  try {
    // Remove old custom POI layers if they exist (from style reload)
    if (map.getLayer('all-poi-labels')) map.removeLayer('all-poi-labels');
    if (map.getLayer('all-poi-dots')) map.removeLayer('all-poi-dots');
    if (map.getSource('kg-streets')) map.removeSource('kg-streets');

    // Add streets vector source — Standard style doesn't expose composite/poi_label
    map.addSource('kg-streets', {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    });

    // Circle dots for every POI
    map.addLayer({
      id: 'all-poi-dots',
      type: 'circle',
      source: 'kg-streets',
      'source-layer': 'poi_label',
      minzoom: 13,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 3, 15, 5, 17, 6],
        'circle-color': isDark ? '#ff9f43' : '#c87030',
        'circle-opacity': isDark ? 0.85 : 0.7,
        'circle-stroke-width': 0,
      },
      slot: 'top',
    } as mapboxgl.LayerSpecification & { slot?: string });

    // Text labels for POIs
    map.addLayer({
      id: 'all-poi-labels',
      type: 'symbol',
      source: 'kg-streets',
      'source-layer': 'poi_label',
      minzoom: 14,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 14, 10, 16, 12, 18, 13],
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
        'text-radial-offset': 0.7,
        'text-justify': 'auto',
        'text-max-width': 8,
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'text-optional': true,
      },
      paint: {
        'text-color': isDark ? '#ffffff' : 'rgba(40,40,40,0.95)',
        'text-halo-color': isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
        'text-halo-width': 2,
        'text-halo-blur': 0.5,
      },
      slot: 'top',
    } as mapboxgl.LayerSpecification & { slot?: string });

    // Click handler for POI popup with directions
    const onPoiClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      const f = e.features[0];
      const name = f.properties?.name || 'Unknown Place';
      const category = f.properties?.category_en || f.properties?.type || f.properties?.class || '';
      const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];

      if (popupRef.current) popupRef.current.remove();
      const popup = new mapboxgl.Popup({ offset: 14, closeButton: true, maxWidth: '260px', className: 'poi-popup' })
        .setLngLat(e.lngLat)
        .setHTML(poiPopupHTML(name, category, coords))
        .addTo(map);
      popupRef.current = popup;

      const el = popup.getElement();
      if (el) {
        el.addEventListener('click', (evt) => {
          const btn = (evt.target as HTMLElement).closest('[data-dir-mode]') as HTMLElement | null;
          if (!btn) return;
          evt.preventDefault();
          const mode = btn.dataset.dirMode as 'walking' | 'driving' | 'cycling';
          const container = el.querySelector('[data-poi-name]') as HTMLElement | null;
          if (!container) return;
          const poiName = container.dataset.poiName || name;
          const poiLat = parseFloat(container.dataset.poiLat || '0');
          const poiLng = parseFloat(container.dataset.poiLng || '0');
          window.dispatchEvent(new CustomEvent('kg-directions', {
            detail: { name: poiName, lat: poiLat, lng: poiLng, mode },
          }));
          popup.remove();
        });
      }
    };

    map.on('click', 'all-poi-dots', onPoiClick);
    map.on('click', 'all-poi-labels', onPoiClick);
    map.on('mouseenter', 'all-poi-dots', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseenter', 'all-poi-labels', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'all-poi-dots', () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseleave', 'all-poi-labels', () => { map.getCanvas().style.cursor = ''; });
  } catch (err) {
    if (import.meta.env.DEV) console.error('[KG] POI setup error:', err);
  }
}

/** Enable 3D terrain + sky atmosphere */
function setup3DTerrain(map: mapboxgl.Map) {
  try {
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
    }
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

    if (!map.getLayer('sky')) {
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0, 0],
          'sky-atmosphere-sun-intensity': 15,
        },
      });
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error('[KG] 3D terrain setup error:', err);
  }
}

/** Get time-adaptive building colors — warm dusk, deep night, cool day */
function getTimeAdaptiveBuildingColors(): { colors: mapboxgl.ExpressionSpecification; glowColor: string; glowOpacity: number } {
  const hour = new Date().getHours();
  const isNight = hour >= 21 || hour < 5;
  const isDusk = hour >= 17 && hour < 21;
  const isDawn = hour >= 5 && hour < 8;

  if (isNight) {
    return {
      colors: ['interpolate', ['linear'], ['get', 'height'],
        0, '#0f1218', 20, '#141a28', 50, '#111825', 100, '#0d1420', 200, '#0a1018'],
      glowColor: '#22d3ee',
      glowOpacity: 0.10,
    };
  }
  if (isDusk) {
    return {
      colors: ['interpolate', ['linear'], ['get', 'height'],
        0, '#1a1d2e', 20, '#1e2540', 50, '#1c2238', 100, '#181e30', 200, '#141828'],
      glowColor: '#ff8c42',
      glowOpacity: 0.08,
    };
  }
  if (isDawn) {
    return {
      colors: ['interpolate', ['linear'], ['get', 'height'],
        0, '#1e2030', 20, '#252840', 50, '#1e2438', 100, '#1a2030', 200, '#151a28'],
      glowColor: '#fbbf24',
      glowOpacity: 0.06,
    };
  }
  // Day
  return {
    colors: ['interpolate', ['linear'], ['get', 'height'],
      0, '#1a2332', 20, '#1e3a5f', 50, '#1a365d', 100, '#1e293b', 200, '#0f172a'],
    glowColor: '#22d3ee',
    glowOpacity: 0.06,
  };
}

/** Enhanced 3D buildings with ambient lighting and time-adaptive colors */
function setup3DBuildings(map: mapboxgl.Map, isDark: boolean) {
  try {
    // Add custom 3D building layer from composite source
    if (!map.getSource('composite')) {
      if (!map.getSource('kg-buildings')) {
        map.addSource('kg-buildings', {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-streets-v8',
        });
      }
    }

    const buildingSrc = map.getSource('composite') ? 'composite' : 'kg-buildings';

    // Remove existing custom building layers
    ['kg-buildings-3d', 'kg-buildings-glow'].forEach(l => {
      if (map.getLayer(l)) map.removeLayer(l);
    });

    // Get time-adaptive colors for dark mode
    const timeColors = getTimeAdaptiveBuildingColors();

    // 3D building extrusions — glass/steel aesthetic with time adaptation
    map.addLayer({
      id: 'kg-buildings-3d',
      type: 'fill-extrusion',
      source: buildingSrc,
      'source-layer': 'building',
      minzoom: 14,
      filter: ['==', ['get', 'extrude'], 'true'],
      paint: {
        'fill-extrusion-color': isDark
          ? timeColors.colors
          : [
            'interpolate', ['linear'], ['get', 'height'],
            0, '#e2e8f0', 20, '#cbd5e1', 50, '#94a3b8', 100, '#64748b', 200, '#475569',
          ],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': isDark ? 0.88 : 0.75,
        'fill-extrusion-vertical-gradient': true,
      },
    } as mapboxgl.LayerSpecification);

    // Time-adaptive ambient glow on building tops (dark mode only)
    if (isDark) {
      map.addLayer({
        id: 'kg-buildings-glow',
        type: 'fill-extrusion',
        source: buildingSrc,
        'source-layer': 'building',
        minzoom: 15,
        filter: ['all', ['==', ['get', 'extrude'], 'true'], ['>', ['get', 'height'], 15]],
        paint: {
          'fill-extrusion-color': timeColors.glowColor,
          'fill-extrusion-height': ['+', ['get', 'height'], 0.5],
          'fill-extrusion-base': ['get', 'height'],
          'fill-extrusion-opacity': timeColors.glowOpacity,
        },
      } as mapboxgl.LayerSpecification);
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error('[KG] 3D buildings setup error:', err);
  }
}

/** Switch buildings to navigation-mode styling — darker, more cinematic */
function setNavigationBuildingStyle(map: mapboxgl.Map, navigating: boolean) {
  try {
    if (!map.getLayer('kg-buildings-3d')) return;
    if (navigating) {
      // Cinematic dark blue buildings during navigation
      map.setPaintProperty('kg-buildings-3d', 'fill-extrusion-color', [
        'interpolate', ['linear'], ['get', 'height'],
        0, '#0c1220',
        20, '#111d2e',
        50, '#162033',
        100, '#0d1b2a',
        200, '#0a1628',
      ]);
      map.setPaintProperty('kg-buildings-3d', 'fill-extrusion-opacity', 0.92);
      // Brighter cyan glow on taller buildings
      if (map.getLayer('kg-buildings-glow')) {
        map.setPaintProperty('kg-buildings-glow', 'fill-extrusion-opacity', 0.12);
        map.setPaintProperty('kg-buildings-glow', 'fill-extrusion-color', '#22d3ee');
      }
    } else {
      // Reset to normal dark-mode style
      map.setPaintProperty('kg-buildings-3d', 'fill-extrusion-color', [
        'interpolate', ['linear'], ['get', 'height'],
        0, '#1a2332',
        20, '#1e3a5f',
        50, '#1a365d',
        100, '#1e293b',
        200, '#0f172a',
      ]);
      map.setPaintProperty('kg-buildings-3d', 'fill-extrusion-opacity', 0.85);
      if (map.getLayer('kg-buildings-glow')) {
        map.setPaintProperty('kg-buildings-glow', 'fill-extrusion-opacity', 0.06);
      }
    }
  } catch { /* no-op */ }
}

const CATEGORY_MAP: Record<string, string[]> = {
  'All': [],
  '\u{1F374} Food': ['Restaurant', 'BBQ', 'Japanese', 'American'],
  '\u2615 Coffee': ['Coffee'],
  '\u{1F37A} Bars': ['Brewery', 'Bar', 'Brewpub'],
  '\u{1F33F} Parks': ['Park'],
};

const POI_CLASS_MAP: Record<string, string[]> = {
  'All': [],
  '\u{1F374} Food': ['food_and_drink', 'restaurant', 'food_and_drink_stores', 'cafe'],
  '\u2615 Coffee': ['cafe'],
  '\u{1F37A} Bars': ['bar', 'nightlife'],
  '\u{1F33F} Parks': ['park_like', 'sport_and_leisure'],
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

function poiPopupHTML(name: string, category: string, coords: [number, number]): string {
  const lat = coords[1];
  const lng = coords[0];
  const uberUrl = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodeURIComponent(name)}`;

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro',system-ui,sans-serif;min-width:220px"
              data-poi-name="${name.replace(/"/g, '&quot;')}" data-poi-lat="${lat}" data-poi-lng="${lng}">
    <p style="font-weight:700;font-size:15px;color:var(--k-text,#fff);margin:0 0 3px;letter-spacing:-0.01em">${name}</p>
    <p style="font-size:12px;color:var(--k-text-m,rgba(255,255,255,0.48));margin:0 0 10px;text-transform:capitalize">${category || 'Place'}</p>
    <div class="poi-mode-row">
      <button data-dir-mode="driving" class="poi-mode-btn">Drive</button>
      <button data-dir-mode="walking" class="poi-mode-btn poi-mode-active">Walk</button>
      <button data-dir-mode="cycling" class="poi-mode-btn">Bike</button>
      <a href="${uberUrl}" target="_blank" rel="noopener" class="poi-mode-btn">Uber</a>
    </div>
  </div>`;
}

export function LiveMap({ onKGClick }: { onKGClick?: () => void }) {
  const { selectedCity, theme, mapRef, directions, flyoverActive, startDirections, venues, venueById, highlightedVenueId, setHighlightedVenueId, selectedVenue, selectVenue: ctxSelectVenue, closeVenueSheet, favorites } = useAppContext();
  const [activeCategory, setActiveCategory] = useState('All');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [flyoverWaypoint, setFlyoverWaypoint] = useState<{ name: string; index: number; total: number } | null>(null);
  const [flyoverPhase, setFlyoverPhase] = useState<import('../../utils/flyover').FlyoverPhase>('idle');
  const cancelFlyoverRef = useRef<(() => void) | null>(null);
  const pulseFrameRef = useRef<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const carMarkerRef = useRef<mapboxgl.Marker | null>(null);
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
      pitch: 45,
      attributionControl: false,
      projection: 'globe' as any,
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
      const isDark = initThemeRef.current === 'dark';
      setup3DTerrain(map);
      setup3DBuildings(map, isDark);
      setupPOILayers(map, popupRef, isDark);
      setMapLoaded(true);
      setTimeout(() => geolocate.trigger(), 500);
    });

    mapRef.current = map;

    // Listen for POI popup direction requests
    const onDirRequest = (e: Event) => {
      const { name, lat, lng, mode } = (e as CustomEvent).detail;
      startDirections({ coords: [lat, lng], name }, mode);
    };
    window.addEventListener('kg-directions', onDirRequest);

    return () => {
      window.removeEventListener('kg-directions', onDirRequest);
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
    // Update building colors for new theme
    setup3DBuildings(map, isDark);
    // Update POI label colors for new theme
    if (map.getLayer('all-poi-dots')) {
      map.setPaintProperty('all-poi-dots', 'circle-color', isDark ? '#ff9f43' : '#c87030');
      map.setPaintProperty('all-poi-dots', 'circle-opacity', isDark ? 0.85 : 0.7);
    }
    if (map.getLayer('all-poi-labels')) {
      map.setPaintProperty('all-poi-labels', 'text-color', isDark ? '#ffffff' : 'rgba(40,40,40,0.95)');
      map.setPaintProperty('all-poi-labels', 'text-halo-color', isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)');
    }
  }, [theme]);

  // 3. City changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [selectedCity.coordinates[1], selectedCity.coordinates[0]], zoom: Math.max(selectedCity.zoom, 14), duration: 1200 });
  }, [selectedCity]);

  // 4. Filter POI layers by category
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (!map.getLayer('all-poi-dots') && !map.getLayer('all-poi-labels')) return;

    const layers = ['all-poi-dots', 'all-poi-labels'];
    if (activeCategory === 'All') {
      for (const id of layers) {
        if (map.getLayer(id)) map.setFilter(id, null);
      }
    } else {
      const classes = POI_CLASS_MAP[activeCategory] || [];
      if (classes.length > 0) {
        const filter: mapboxgl.FilterSpecification = ['match', ['get', 'class'], classes, true, false];
        for (const id of layers) {
          if (map.getLayer(id)) map.setFilter(id, filter);
        }
      }
    }
  }, [activeCategory, mapLoaded]);

  // 6. Heatmap — subtle glow BEHIND poi labels, not covering them
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    let cancelled = false;
    let clickHandler: ((e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => void) | null = null;

    function addLayers() {
      if (cancelled) return;
      const geojson = buildGeoJSON(filteredVenues, favorites);

      // Clean up previous layers including pulse rings, icons, and fav hearts
      cancelAnimationFrame(pulseFrameRef.current);
      ['crowd-venue-icons', 'crowd-fav-hearts', 'crowd-pulse-busy', 'crowd-pulse-moderate', 'crowd-pulse-quiet', 'crowd-heat', 'crowd-points'].forEach(id => {
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

      // ── Pulsing glow rings — three layers, one per crowd level, animated by rAF ──
      const PULSE_CONFIGS = [
        { id: 'crowd-pulse-busy' as const, crowd: 'busy' as const, color: '#ff4d6a', hz: 1.5, maxOpacity: 0.4, boost: 8 },
        { id: 'crowd-pulse-moderate' as const, crowd: 'moderate' as const, color: '#fbbf24', hz: 0.7, maxOpacity: 0.25, boost: 5 },
        { id: 'crowd-pulse-quiet' as const, crowd: 'quiet' as const, color: '#34d399', hz: 0.35, maxOpacity: 0.12, boost: 3 },
      ];

      for (const cfg of PULSE_CONFIGS) {
        map.addLayer({
          id: cfg.id,
          type: 'circle',
          source: 'venues',
          filter: ['==', ['get', 'crowd'], cfg.crowd],
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 6, 14, 12, 16, 16],
            'circle-color': cfg.color,
            'circle-opacity': 0,
            'circle-stroke-width': 0,
          },
        });
      }

      // Circle points for KrowdGuide venues — on top of pulse rings
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

      // ── rAF pulse animation loop ──
      const pulseStart = performance.now();
      const animatePulse = (now: number) => {
        if (cancelled || !map.getLayer('crowd-pulse-busy')) return;
        if (document.hidden) { pulseFrameRef.current = requestAnimationFrame(animatePulse); return; }
        const t = (now - pulseStart) / 1000;
        for (const cfg of PULSE_CONFIGS) {
          if (!map.getLayer(cfg.id)) continue;
          const sine = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * cfg.hz);
          map.setPaintProperty(cfg.id, 'circle-opacity', sine * cfg.maxOpacity);
          map.setPaintProperty(cfg.id, 'circle-radius', [
            'interpolate', ['linear'], ['zoom'],
            10, 4 + sine * cfg.boost,
            14, 8 + sine * cfg.boost,
            16, 11 + sine * cfg.boost,
          ]);
        }
        pulseFrameRef.current = requestAnimationFrame(animatePulse);
      };
      pulseFrameRef.current = requestAnimationFrame(animatePulse);

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
      cancelAnimationFrame(pulseFrameRef.current);
      if (clickHandler) map.off('click', 'crowd-points', clickHandler);
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
    const routeLayers = ['directions-route-outline', 'directions-route', 'directions-dest-dot', 'directions-origin-dot', 'directions-origin-pulse'];
    const routeSources = ['directions-route', 'directions-dest', 'directions-origin'];
    routeLayers.forEach(l => { if (map.getLayer(l)) map.removeLayer(l); });
    routeSources.forEach(s => { if (map.getSource(s)) map.removeSource(s); });

    if (!directions.route || !directions.active) return;

    // Add route line
    map.addSource('directions-route', {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: directions.route.geometry },
    });

    // Outline (darker halo for depth)
    map.addLayer({
      id: 'directions-route-outline',
      type: 'line',
      source: 'directions-route',
      paint: {
        'line-color': '#0e7490',
        'line-width': 10,
        'line-opacity': 0.25,
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });

    // Main route line — thick teal like reference
    map.addLayer({
      id: 'directions-route',
      type: 'line',
      source: 'directions-route',
      paint: {
        'line-color': '#22d3ee',
        'line-width': 6,
        'line-opacity': 0.95,
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    });

    // Origin marker (cyan pulsing dot)
    if (directions.origin) {
      map.addSource('directions-origin', {
        type: 'geojson',
        data: {
          type: 'Feature', properties: {},
          geometry: { type: 'Point', coordinates: directions.origin },
        },
      });
      map.addLayer({
        id: 'directions-origin-pulse',
        type: 'circle',
        source: 'directions-origin',
        paint: {
          'circle-radius': 14,
          'circle-color': '#22d3ee',
          'circle-opacity': 0.15,
        },
      });
      map.addLayer({
        id: 'directions-origin-dot',
        type: 'circle',
        source: 'directions-origin',
        paint: {
          'circle-radius': 7,
          'circle-color': '#22d3ee',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      });
    }

    // Destination marker (coral dot)
    if (directions.destination) {
      map.addSource('directions-dest', {
        type: 'geojson',
        data: {
          type: 'Feature', properties: {},
          geometry: { type: 'Point', coordinates: directions.destination.coords },
        },
      });
      map.addLayer({
        id: 'directions-dest-dot',
        type: 'circle',
        source: 'directions-dest',
        paint: {
          'circle-radius': 8,
          'circle-color': '#ff4d6a',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      });
    }

    // Fit bounds to show full route
    const coords = directions.route.geometry.coordinates as [number, number][];
    const bounds = coords.reduce(
      (b, c) => b.extend(c as mapboxgl.LngLatLike),
      new mapboxgl.LngLatBounds(coords[0], coords[0])
    );
    map.fitBounds(bounds, { padding: { top: 120, bottom: 320, left: 60, right: 60 }, duration: 800 });

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
    const navLayers = ['directions-completed', 'directions-active-step', 'directions-active-glow'];
    const navSources = ['directions-completed', 'directions-current-segment'];

    // Clean up nav layers
    navLayers.forEach(l => { if (map.getLayer(l)) map.removeLayer(l); });
    navSources.forEach(s => { if (map.getSource(s)) map.removeSource(s); });

    if (!directions.navigating || !directions.route) {
      // Restore main route opacity when not navigating
      if (map.getLayer('directions-route')) {
        map.setPaintProperty('directions-route', 'line-opacity', 0.95);
      }
      if (map.getLayer('directions-route-outline')) {
        map.setPaintProperty('directions-route-outline', 'line-opacity', 0.25);
      }
      // Reset buildings to normal style
      setNavigationBuildingStyle(map, false);
      // Remove car marker
      if (carMarkerRef.current) {
        carMarkerRef.current.remove();
        carMarkerRef.current = null;
      }
      return;
    }

    // Switch buildings to cinematic navigation style
    setNavigationBuildingStyle(map, true);

    const { steps } = directions.route;
    const idx = directions.currentStepIndex;
    if (idx >= steps.length) return; // arrived

    // Dim the main route
    if (map.getLayer('directions-route')) {
      map.setPaintProperty('directions-route', 'line-opacity', 0.3);
    }
    if (map.getLayer('directions-route-outline')) {
      map.setPaintProperty('directions-route-outline', 'line-opacity', 0.1);
    }

    // Completed segments (all steps before current)
    if (idx > 0) {
      const completedCoords: GeoJSON.Position[][] = [];
      for (let i = 0; i < idx; i++) {
        if (steps[i].geometry?.coordinates) {
          completedCoords.push(steps[i].geometry.coordinates);
        }
      }
      if (completedCoords.length > 0) {
        map.addSource('directions-completed', {
          type: 'geojson',
          data: {
            type: 'Feature', properties: {},
            geometry: { type: 'MultiLineString', coordinates: completedCoords },
          },
        });
        map.addLayer({
          id: 'directions-completed',
          type: 'line',
          source: 'directions-completed',
          paint: { 'line-color': '#94a3b8', 'line-width': 5, 'line-opacity': 0.35 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
      }
    }

    // Current segment — glow + main
    const currentStep = steps[idx];
    if (currentStep.geometry?.coordinates) {
      map.addSource('directions-current-segment', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: currentStep.geometry },
      });
      map.addLayer({
        id: 'directions-active-glow',
        type: 'line',
        source: 'directions-current-segment',
        paint: { 'line-color': '#22d3ee', 'line-width': 12, 'line-opacity': 0.2, 'line-blur': 4 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });
      map.addLayer({
        id: 'directions-active-step',
        type: 'line',
        source: 'directions-current-segment',
        paint: { 'line-color': '#22d3ee', 'line-width': 7, 'line-opacity': 1 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });

      // Camera — ease to current step midpoint with bearing
      const coords = currentStep.geometry.coordinates;
      const midIdx = Math.floor(coords.length / 2);
      const midpoint = coords[midIdx] || coords[0];
      const bearing = currentStep.maneuver.bearing_after ?? map.getBearing();

      map.easeTo({
        center: midpoint as [number, number],
        bearing,
        pitch: 60,
        zoom: 17,
        duration: 800,
      });

      // 3D car marker for driving mode
      if (directions.mode === 'driving') {
        const startCoord = coords[0] as [number, number];
        const carBearing = bearing ?? 0;
        if (!carMarkerRef.current) {
          const el = document.createElement('div');
          el.className = 'nav-car-marker';
          el.innerHTML = `
            <div class="nav-car-beam"></div>
            <svg class="nav-car-body" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="car-body-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#0c5c73"/>
                  <stop offset="20%" stop-color="#0e7490"/>
                  <stop offset="40%" stop-color="#22d3ee"/>
                  <stop offset="50%" stop-color="#67e8f9"/>
                  <stop offset="60%" stop-color="#22d3ee"/>
                  <stop offset="80%" stop-color="#0e7490"/>
                  <stop offset="100%" stop-color="#0c5c73"/>
                </linearGradient>
                <linearGradient id="car-hood-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="rgba(255,255,255,0.3)"/>
                  <stop offset="60%" stop-color="rgba(255,255,255,0.05)"/>
                  <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
                </linearGradient>
                <linearGradient id="car-roof-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#0e4f5e"/>
                  <stop offset="25%" stop-color="#1498b5"/>
                  <stop offset="50%" stop-color="#7dd3fc"/>
                  <stop offset="75%" stop-color="#1498b5"/>
                  <stop offset="100%" stop-color="#0e4f5e"/>
                </linearGradient>
                <linearGradient id="car-window-grad" x1="0.3" y1="0" x2="0.7" y2="1">
                  <stop offset="0%" stop-color="#1a3d5c"/>
                  <stop offset="50%" stop-color="#0c2d4a"/>
                  <stop offset="100%" stop-color="#071e33"/>
                </linearGradient>
                <linearGradient id="car-reflect" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="rgba(255,255,255,0.4)"/>
                  <stop offset="40%" stop-color="rgba(255,255,255,0.08)"/>
                  <stop offset="100%" stop-color="rgba(255,255,255,0.2)"/>
                </linearGradient>
                <radialGradient id="headlight-glow" cx="0.5" cy="0.5" r="0.6">
                  <stop offset="0%" stop-color="#fffde4"/>
                  <stop offset="30%" stop-color="#fde047"/>
                  <stop offset="100%" stop-color="rgba(253,224,71,0)"/>
                </radialGradient>
                <radialGradient id="wheel-grad" cx="0.4" cy="0.4" r="0.6">
                  <stop offset="0%" stop-color="#64748b"/>
                  <stop offset="40%" stop-color="#334155"/>
                  <stop offset="100%" stop-color="#0f172a"/>
                </radialGradient>
                <linearGradient id="car-underbody" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="rgba(34,211,238,0.15)"/>
                  <stop offset="100%" stop-color="rgba(34,211,238,0)"/>
                </linearGradient>
                <!-- Headlight beam gradient -->
                <linearGradient id="beam-grad" x1="0.5" y1="1" x2="0.5" y2="0">
                  <stop offset="0%" stop-color="rgba(254,240,138,0.25)"/>
                  <stop offset="100%" stop-color="rgba(254,240,138,0)"/>
                </linearGradient>
              </defs>

              <!-- Headlight beams projected forward -->
              <path d="M38,28 L30,2 L50,12 Z" fill="url(#beam-grad)" opacity="0.5"/>
              <path d="M82,28 L90,2 L70,12 Z" fill="url(#beam-grad)" opacity="0.5"/>

              <!-- Underbody glow -->
              <ellipse cx="60" cy="75" rx="30" ry="40" fill="url(#car-underbody)"/>

              <!-- Car body shell — sculpted sedan silhouette -->
              <path d="M42,28 C40,28 37,31 35,38 L33,50 L33,90 L35,100 C37,107 39,110 43,110 L77,110 C81,110 83,107 85,100 L87,90 L87,50 L85,38 C83,31 80,28 78,28 Z"
                    fill="url(#car-body-grad)" stroke="#0a6175" stroke-width="0.8"/>

              <!-- Hood metallic reflection -->
              <path d="M42,28 C40,28 37,31 35,38 L33,48 L87,48 L85,38 C83,31 80,28 78,28 Z"
                    fill="url(#car-hood-grad)"/>

              <!-- Trunk metallic reflection -->
              <path d="M35,98 L33,90 L87,90 L85,98 C83,105 81,108 77,108 L43,108 C39,108 37,105 35,98 Z"
                    fill="rgba(255,255,255,0.06)"/>

              <!-- Body character line (left) -->
              <path d="M33.5,52 L33.5,88" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
              <!-- Body character line (right) -->
              <path d="M86.5,52 L86.5,88" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

              <!-- Front grille -->
              <path d="M40,30 L80,30" stroke="rgba(255,255,255,0.12)" stroke-width="2" stroke-linecap="round"/>
              <path d="M42,33 L78,33" stroke="rgba(0,0,0,0.2)" stroke-width="1" stroke-linecap="round"/>

              <!-- Rear diffuser -->
              <path d="M44,108 L76,108" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-linecap="round"/>

              <!-- Cabin/roof — sculpted greenhouse -->
              <path d="M46,44 C44,44 42,46 41,49 L40,58 L40,80 L41,88 C42,91 44,93 46,93 L74,93 C76,93 78,91 79,88 L80,80 L80,58 L79,49 C78,46 76,44 74,44 Z"
                    fill="url(#car-roof-grad)" stroke="#0891b2" stroke-width="0.4"/>

              <!-- Windshield (front) — raked -->
              <path d="M48,42 C46,42 44,44 43,47 L42,55 L78,55 L77,47 C76,44 74,42 72,42 Z"
                    fill="url(#car-window-grad)" stroke="#164e63" stroke-width="0.4"/>
              <!-- Windshield reflection streak -->
              <path d="M50,43 L56,43 L53,53 L47,53 Z" fill="url(#car-reflect)" opacity="0.5"/>

              <!-- Rear window — fastback curve -->
              <path d="M44,84 C44,87 46,90 48,92 L72,92 C74,90 76,87 76,84 L76,78 L44,78 Z"
                    fill="url(#car-window-grad)" stroke="#164e63" stroke-width="0.4"/>
              <!-- Rear window reflection -->
              <path d="M48,79 L54,79 L52,88 L49,87 Z" fill="url(#car-reflect)" opacity="0.3"/>

              <!-- Side windows left -->
              <path d="M42,57 L42,76 L44,76 L44,57 Z" fill="url(#car-window-grad)" opacity="0.75"/>
              <!-- Side windows right -->
              <path d="M76,57 L76,76 L78,76 L78,57 Z" fill="url(#car-window-grad)" opacity="0.75"/>

              <!-- A-pillar left -->
              <path d="M44,44 L42,55" stroke="#0891b2" stroke-width="1.5" stroke-linecap="round"/>
              <!-- A-pillar right -->
              <path d="M76,44 L78,55" stroke="#0891b2" stroke-width="1.5" stroke-linecap="round"/>

              <!-- B-pillar left -->
              <rect x="42" y="65" width="2" height="3.5" rx="0.5" fill="#0891b2"/>
              <!-- B-pillar right -->
              <rect x="76" y="65" width="2" height="3.5" rx="0.5" fill="#0891b2"/>

              <!-- C-pillar left -->
              <path d="M44,76 L44,84" stroke="#0891b2" stroke-width="1.2" stroke-linecap="round"/>
              <!-- C-pillar right -->
              <path d="M76,76 L76,84" stroke="#0891b2" stroke-width="1.2" stroke-linecap="round"/>

              <!-- Headlights — LED DRL strips -->
              <rect x="37" y="29" width="12" height="3.5" rx="1.5" fill="#fef08a" opacity="0.95"/>
              <rect x="71" y="29" width="12" height="3.5" rx="1.5" fill="#fef08a" opacity="0.95"/>
              <!-- LED inner detail -->
              <rect x="39" y="30" width="3" height="1.5" rx="0.75" fill="#fff" opacity="0.6"/>
              <rect x="44" y="30" width="3" height="1.5" rx="0.75" fill="#fff" opacity="0.4"/>
              <rect x="73" y="30" width="3" height="1.5" rx="0.75" fill="#fff" opacity="0.6"/>
              <rect x="78" y="30" width="3" height="1.5" rx="0.75" fill="#fff" opacity="0.4"/>
              <!-- Headlight glow halos -->
              <ellipse cx="43" cy="26" rx="10" ry="6" fill="url(#headlight-glow)" opacity="0.35"/>
              <ellipse cx="77" cy="26" rx="10" ry="6" fill="url(#headlight-glow)" opacity="0.35"/>

              <!-- DRL accent strip -->
              <path d="M38,34 L48,34" stroke="#38bdf8" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
              <path d="M72,34 L82,34" stroke="#38bdf8" stroke-width="1" stroke-linecap="round" opacity="0.6"/>

              <!-- Taillights — LED bar style -->
              <rect x="38" y="106" width="16" height="3" rx="1.5" fill="#ef4444" opacity="0.9"/>
              <rect x="66" y="106" width="16" height="3" rx="1.5" fill="#ef4444" opacity="0.9"/>
              <!-- Tail inner glow -->
              <rect x="40" y="107" width="12" height="1" rx="0.5" fill="#fca5a5" opacity="0.6"/>
              <rect x="68" y="107" width="12" height="1" rx="0.5" fill="#fca5a5" opacity="0.6"/>
              <!-- Brake light strip connector -->
              <rect x="54" y="107" width="12" height="1.5" rx="0.75" fill="#ef4444" opacity="0.4"/>

              <!-- Side mirrors — aerodynamic -->
              <path d="M28,50 C26,49 25,50 25,52 C25,54 26,55 28,54 L33,52 Z" fill="#0891b2" stroke="#0a6175" stroke-width="0.4"/>
              <path d="M92,50 C94,49 95,50 95,52 C95,54 94,55 92,54 L87,52 Z" fill="#0891b2" stroke="#0a6175" stroke-width="0.4"/>
              <!-- Mirror glass -->
              <ellipse cx="28" cy="52" rx="3" ry="2" fill="#164e63" opacity="0.8"/>
              <ellipse cx="92" cy="52" rx="3" ry="2" fill="#164e63" opacity="0.8"/>

              <!-- Front wheels — performance style -->
              <rect x="25" y="36" width="10" height="16" rx="4.5" fill="url(#wheel-grad)" stroke="#1e293b" stroke-width="0.8"/>
              <rect x="85" y="36" width="10" height="16" rx="4.5" fill="url(#wheel-grad)" stroke="#1e293b" stroke-width="0.8"/>
              <!-- Front wheel rims -->
              <circle cx="30" cy="44" r="2.5" fill="none" stroke="#64748b" stroke-width="0.8"/>
              <circle cx="30" cy="44" r="1" fill="#94a3b8" opacity="0.7"/>
              <circle cx="90" cy="44" r="2.5" fill="none" stroke="#64748b" stroke-width="0.8"/>
              <circle cx="90" cy="44" r="1" fill="#94a3b8" opacity="0.7"/>

              <!-- Rear wheels — performance style -->
              <rect x="25" y="86" width="10" height="16" rx="4.5" fill="url(#wheel-grad)" stroke="#1e293b" stroke-width="0.8"/>
              <rect x="85" y="86" width="10" height="16" rx="4.5" fill="url(#wheel-grad)" stroke="#1e293b" stroke-width="0.8"/>
              <!-- Rear wheel rims -->
              <circle cx="30" cy="94" r="2.5" fill="none" stroke="#64748b" stroke-width="0.8"/>
              <circle cx="30" cy="94" r="1" fill="#94a3b8" opacity="0.7"/>
              <circle cx="90" cy="94" r="2.5" fill="none" stroke="#64748b" stroke-width="0.8"/>
              <circle cx="90" cy="94" r="1" fill="#94a3b8" opacity="0.7"/>

              <!-- Roof specular highlight -->
              <ellipse cx="60" cy="66" rx="10" ry="16" fill="rgba(255,255,255,0.1)"/>
              <!-- Roof sunroof hint -->
              <rect x="52" y="60" width="16" height="10" rx="3" fill="rgba(0,0,0,0.08)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>

              <!-- Hood center crease -->
              <path d="M60,30 L60,44" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
            </svg>
            <div class="nav-car-shadow"></div>
            <div class="nav-car-ring"></div>
          `;
          // Rotate car body to match bearing (relative to map north, Mapbox handles map rotation)
          el.style.transform = `rotate(${carBearing}deg)`;
          carMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center', rotationAlignment: 'map', pitchAlignment: 'map' })
            .setLngLat(startCoord)
            .addTo(map);
        } else {
          carMarkerRef.current.setLngLat(startCoord);
          const el = carMarkerRef.current.getElement();
          el.style.transform = `rotate(${carBearing}deg)`;
        }
      } else {
        // Remove car marker if not driving
        if (carMarkerRef.current) {
          carMarkerRef.current.remove();
          carMarkerRef.current = null;
        }
      }
    }

    return () => {
      navLayers.forEach(l => { if (map.getLayer(l)) map.removeLayer(l); });
      navSources.forEach(s => { if (map.getSource(s)) map.removeSource(s); });
    };
  }, [directions.navigating, directions.currentStepIndex, directions.route, directions.mode, mapLoaded, mapRef]);

  // 8. Flyover — start/stop cinematic tour
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyoverActive) {
      setFlyoverWaypoint(null);
      return;
    }

    const waypoints = venues.map(v => ({
      center: [v.coordinates[1], v.coordinates[0]] as [number, number],
      name: v.name,
    }));

    import('../../utils/flyover').then(({ startFlyover }) => {
      const cancel = startFlyover(map, waypoints, {
        onWaypointChange: (index, wp) => {
          setFlyoverWaypoint({ name: wp.name, index, total: waypoints.length });
        },
        onPhaseChange: (phase) => {
          setFlyoverPhase(phase);
        },
        onComplete: () => {
          setFlyoverWaypoint(null);
          setFlyoverPhase('idle');
        },
      });
      cancelFlyoverRef.current = cancel;
    });

    return () => {
      if (cancelFlyoverRef.current) {
        cancelFlyoverRef.current();
        cancelFlyoverRef.current = null;
      }
      setFlyoverWaypoint(null);
      setFlyoverPhase('idle');
    };
  }, [flyoverActive, venues, mapRef]);

  const handleStopFlyover = useCallback(() => {
    if (cancelFlyoverRef.current) {
      cancelFlyoverRef.current();
      cancelFlyoverRef.current = null;
    }
    setFlyoverWaypoint(null);
    setFlyoverPhase('idle');
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {/* Hide search bar, pills, legend during active navigation */}
      {!directions.navigating && (
        <>
          <MapSearchBar venues={venues} onVenueSelect={selectVenue} onKGClick={onKGClick} />
          <CategoryPills active={activeCategory} onChange={setActiveCategory} />
          <MapLegend />
        </>
      )}
      {flyoverPhase !== 'idle' && flyoverWaypoint && (
        <FlyoverOverlay
          waypointName={flyoverWaypoint.name}
          currentIndex={flyoverWaypoint.index}
          totalCount={flyoverWaypoint.total}
          phase={flyoverPhase}
          onStop={handleStopFlyover}
        />
      )}
      {/* Floating step card — shows first step in preview mode only */}
      {directions.active && !directions.navigating && directions.route && directions.route.steps.length > 0 && (
        <div className="absolute bottom-[180px] left-4 right-4 z-[200]">
          <div className="liquid-glass rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22d3ee]/15 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-5 h-5 text-[#22d3ee]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#22d3ee] font-bold uppercase tracking-wider">
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
