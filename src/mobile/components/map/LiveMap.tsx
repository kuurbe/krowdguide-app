import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppContext } from '../../context';
import { MAPBOX_TOKEN } from '../../config/mapbox';
import { getVenuesForCity } from '../../data/venues';
import { MapSearchBar } from './MapSearchBar';
import { CategoryPills } from './CategoryPills';
import { MapLegend } from './MapLegend';
import { VenueDetailSheet } from './VenueDetailSheet';
import { FlyoverOverlay } from './FlyoverOverlay';
import type { Venue } from '../../types';
import { Navigation } from 'lucide-react';
import { formatDistance } from '../../services/directionsService';

mapboxgl.accessToken = MAPBOX_TOKEN;

/** Set up custom POI layers from the composite source — shows ALL places */
function setupPOILayers(map: mapboxgl.Map, popupRef: React.MutableRefObject<mapboxgl.Popup | null>) {
  try {
    const isDark = map.getStyle()?.name?.toLowerCase().includes('dark');

    // Hide built-in poi-label (has restrictive density filters)
    if (map.getLayer('poi-label')) {
      map.setLayoutProperty('poi-label', 'visibility', 'none');
    }

    // Remove old custom POI layers if they exist (from style reload)
    if (map.getLayer('all-poi-labels')) map.removeLayer('all-poi-labels');
    if (map.getLayer('all-poi-dots')) map.removeLayer('all-poi-dots');

    // Circle dots for every POI — circles bypass collision detection, so ALL show
    map.addLayer({
      id: 'all-poi-dots',
      type: 'circle',
      source: 'composite',
      'source-layer': 'poi_label',
      minzoom: 13,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 3, 15, 5, 17, 6],
        'circle-color': isDark ? '#ff9f43' : '#c87030',
        'circle-opacity': isDark ? 0.85 : 0.7,
        'circle-stroke-width': 0,
      },
    });

    // Text labels for POIs — variable anchor for maximum density
    map.addLayer({
      id: 'all-poi-labels',
      type: 'symbol',
      source: 'composite',
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
    });

    // Move POI layers to top of layer stack so they're always visible
    map.moveLayer('all-poi-dots');
    map.moveLayer('all-poi-labels');

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

      // Delegated click handler for in-app directions buttons
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
          // Dispatch custom event — LiveMap will listen for this
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

    // Boost transit/airport labels
    for (const layerId of ['transit-label', 'airport-label', 'natural-point-label', 'waterway-label']) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
        map.setPaintProperty(layerId, 'text-opacity', 1);
        map.setPaintProperty(layerId, 'icon-opacity', 1);
      }
    }
  } catch (err) {
    console.error('[KG] POI setup error:', err);
  }
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

function buildGeoJSON(venues: Venue[]) {
  return {
    type: 'FeatureCollection' as const,
    features: venues.map(v => ({
      type: 'Feature' as const,
      properties: { id: v.id, name: v.name, pct: v.pct, crowd: v.crowd, weight: v.pct / 100 },
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

export function LiveMap() {
  const { selectedCity, theme, mapRef, directions, flyoverActive, startDirections } = useAppContext();
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [flyoverWaypoint, setFlyoverWaypoint] = useState<{ name: string; index: number; total: number } | null>(null);
  const cancelFlyoverRef = useRef<(() => void) | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const initThemeRef = useRef(theme);

  const venues = useMemo(() => getVenuesForCity(selectedCity.id), [selectedCity.id]);
  const filteredVenues = useMemo(() => {
    if (activeCategory === 'All') return venues;
    const kw = CATEGORY_MAP[activeCategory] || [];
    return venues.filter(v => kw.some(k => v.type.toLowerCase().includes(k.toLowerCase())));
  }, [venues, activeCategory]);

  const selectVenue = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    const map = mapRef.current;
    if (map) {
      map.flyTo({ center: [venue.coordinates[1], venue.coordinates[0]], zoom: 15, duration: 800 });
    }
  }, []);

  const closeVenueSheet = useCallback(() => { setSelectedVenue(null); }, []);

  // 1. Create map — zoom in closer by default so POIs are visible
  useEffect(() => {
    if (!containerRef.current) return;

    const initStyle = initThemeRef.current === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: initStyle,
      center: [selectedCity.coordinates[1], selectedCity.coordinates[0]],
      zoom: Math.max(selectedCity.zoom, 14), // Start at z14+ so real places are visible
      attributionControl: false,
      pitchWithRotate: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
      showAccuracyCircle: false,
    });
    map.addControl(geolocate, 'bottom-right');

    map.on('load', () => {
      setMapLoaded(true);
      setupPOILayers(map, popupRef);
      setTimeout(() => geolocate.trigger(), 500);
    });
    map.on('style.load', () => {
      setMapLoaded(true);
      setupPOILayers(map, popupRef);
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

  // 2. Theme changes
  const prevThemeRef = useRef(theme);
  useEffect(() => {
    if (prevThemeRef.current === theme) return;
    prevThemeRef.current = theme;
    const map = mapRef.current;
    if (!map) return;
    setMapLoaded(false);
    map.setStyle(theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
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

    const geojson = buildGeoJSON(filteredVenues);

    if (map.getLayer('crowd-heat')) map.removeLayer('crowd-heat');
    if (map.getLayer('crowd-points')) map.removeLayer('crowd-points');
    if (map.getSource('venues')) map.removeSource('venues');

    map.addSource('venues', { type: 'geojson', data: geojson });

    // Insert heatmap BELOW POI layers so real places always show on top
    const beforeLayer = map.getLayer('all-poi-dots') ? 'all-poi-dots'
      : map.getLayer('poi-label') ? 'poi-label' : undefined;

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
        // Subtle — never overwhelm the real map
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 14, 0.4, 17, 0.25],
      },
    }, beforeLayer);

    // Circle points for KrowdGuide venues — on top of everything
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

    // Click circle points → open KrowdGuide VenueDetailSheet
    const onClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      const venueId = e.features[0].properties?.id;
      const venue = filteredVenues.find(v => v.id === venueId);
      if (venue) selectVenue(venue);
    };

    map.on('click', 'crowd-points', onClick);
    map.on('mouseenter', 'crowd-points', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'crowd-points', () => { map.getCanvas().style.cursor = ''; });

    return () => { map.off('click', 'crowd-points', onClick); };
  }, [mapLoaded, filteredVenues, selectVenue]);

  // 7. Route rendering — draw directions polyline on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

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
        onComplete: () => {
          setFlyoverWaypoint(null);
          // Will be set to false by the parent
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
    };
  }, [flyoverActive, venues, mapRef]);

  const handleStopFlyover = useCallback(() => {
    if (cancelFlyoverRef.current) {
      cancelFlyoverRef.current();
      cancelFlyoverRef.current = null;
    }
    setFlyoverWaypoint(null);
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <MapSearchBar venues={venues} onVenueSelect={selectVenue} />
      <CategoryPills active={activeCategory} onChange={setActiveCategory} />
      <MapLegend />
      {flyoverWaypoint && (
        <FlyoverOverlay
          waypointName={flyoverWaypoint.name}
          currentIndex={flyoverWaypoint.index}
          totalCount={flyoverWaypoint.total}
          onStop={handleStopFlyover}
        />
      )}
      {/* Floating step card — shows first direction step over map */}
      {directions.active && directions.route && directions.route.steps.length > 0 && (
        <div className="absolute bottom-[180px] left-4 right-4 z-[200]">
          <div className="bg-[#1a1a2e]/95 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/[0.06]">
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
      <VenueDetailSheet venue={selectedVenue} onClose={closeVenueSheet} />
    </div>
  );
}
