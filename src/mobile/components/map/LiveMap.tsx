import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppContext } from '../../context';
import { getVenuesForCity } from '../../data/venues';
import { MapSearchBar } from './MapSearchBar';
import { CategoryPills } from './CategoryPills';
import { MapLegend } from './MapLegend';
import { CityGuideDrawer } from './CityGuideDrawer';
import { VenueDetailSheet } from './VenueDetailSheet';
import type { Venue } from '../../types';

mapboxgl.accessToken = 'pk.eyJ1IjoiamNvbGJ5eTIiLCJhIjoiY21pcWV5dTBmMGw1MzNlcHdrbnBxZGlxNSJ9.ltCqt3qSjsuUsP_Q3D0F7g';

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
      popupRef.current = new mapboxgl.Popup({ offset: 14, closeButton: true, maxWidth: '240px', className: 'poi-popup' })
        .setLngLat(e.lngLat)
        .setHTML(poiPopupHTML(name, category, coords))
        .addTo(map);
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
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const dirUrl = isIOS
    ? `maps://maps.apple.com/?daddr=${coords[1]},${coords[0]}&dirflg=w`
    : `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}&travelmode=walking`;
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro',system-ui,sans-serif;min-width:170px">
    <p style="font-weight:700;font-size:15px;color:var(--k-text,#fff);margin:0 0 3px;letter-spacing:-0.01em">${name}</p>
    <p style="font-size:12px;color:var(--k-text-m,rgba(255,255,255,0.48));margin:0 0 10px;text-transform:capitalize">${category || 'Place'}</p>
    <a href="${dirUrl}" target="_blank" rel="noopener"
       style="display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 0;border-radius:10px;
              background:linear-gradient(135deg,#ff4d6a,#a855f7);color:#fff;font-weight:700;font-size:13px;
              text-decoration:none;letter-spacing:-0.01em">
      Directions
    </a>
  </div>`;
}

export function LiveMap() {
  const { selectedCity, theme } = useAppContext();
  const [activeCategory, setActiveCategory] = useState('All');
  const [cityGuideOpen, setCityGuideOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const initThemeRef = useRef(theme);

  const venues = useMemo(() => getVenuesForCity(selectedCity.id), [selectedCity.id]);
  const filteredVenues = useMemo(() => {
    if (activeCategory === 'All') return venues;
    const kw = CATEGORY_MAP[activeCategory] || [];
    return venues.filter(v => kw.some(k => v.type.toLowerCase().includes(k.toLowerCase())));
  }, [venues, activeCategory]);

  const selectVenue = useCallback((venue: Venue) => {
    setCityGuideOpen(false);
    setSelectedVenue(venue);
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    const map = mapRef.current;
    if (map) {
      map.flyTo({ center: [venue.coordinates[1], venue.coordinates[0]], zoom: 15, duration: 800 });
    }
  }, []);

  const closeVenueSheet = useCallback(() => { setSelectedVenue(null); }, []);

  const openCityGuide = useCallback(() => {
    setSelectedVenue(null);
    setCityGuideOpen(true);
  }, []);

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
    return () => { map.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <MapSearchBar onKGClick={openCityGuide} venues={venues} onVenueSelect={selectVenue} />
      <CategoryPills active={activeCategory} onChange={setActiveCategory} />
      <MapLegend />
      <CityGuideDrawer open={cityGuideOpen} onOpenChange={setCityGuideOpen} />
      <VenueDetailSheet venue={selectedVenue} onClose={closeVenueSheet} />
    </div>
  );
}
