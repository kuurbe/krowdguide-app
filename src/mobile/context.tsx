import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
import type { Map } from 'mapbox-gl';
import type { City, Venue, OraclePulse, MapPOI } from './types';
import type { TravelMode, DirectionsRoute } from './services/directionsService';
import { fetchDirections } from './services/directionsService';
import { getUserLocation } from './utils/userLocation';
import { getVenuesForCity } from './data/venues';
import { usePulseData } from './hooks/usePulseData';

export interface DirectionsState {
  active: boolean;
  origin: [number, number] | null;
  destination: { coords: [number, number]; name: string } | null;
  mode: TravelMode;
  route: DirectionsRoute | null;
  loading: boolean;
  error: string | null;
  navigating: boolean;
  currentStepIndex: number;
}

const INITIAL_DIRECTIONS: DirectionsState = {
  active: false,
  origin: null,
  destination: null,
  mode: 'walking',
  route: null,
  loading: false,
  error: null,
  navigating: false,
  currentStepIndex: 0,
};

interface AppContextType {
  selectedCity: City;
  setSelectedCity: (city: City) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  walkingMode: boolean;
  setWalkingMode: (v: boolean) => void;
  smartNotifs: boolean;
  setSmartNotifs: (v: boolean) => void;
  // Map ref — shared so directions can control the camera
  mapRef: React.MutableRefObject<Map | null>;
  // Directions
  directions: DirectionsState;
  startDirections: (dest: { coords: [number, number]; name: string }, mode?: TravelMode) => void;
  setDirectionsMode: (mode: TravelMode) => void;
  clearDirections: () => void;
  startNavigation: () => void;
  advanceStep: () => void;
  endNavigation: () => void;
  // Venues — single source of truth, pre-fetched for instant card opens
  venues: Venue[];
  venueById: globalThis.Map<string, Venue>;
  pulse: OraclePulse | null;
  isLive: boolean;
  // Map↔List sync — highlighted venue ID for bidirectional coordination
  highlightedVenueId: string | null;
  setHighlightedVenueId: (id: string | null) => void;
  flyToVenue: (venue: Venue) => void;
  // Venue detail sheet — shared so both map and city guide can open it
  selectedVenue: Venue | null;
  selectVenue: (venue: Venue) => void;
  closeVenueSheet: () => void;
  // Favorites — persisted in localStorage
  favorites: Set<string>;
  toggleFavorite: (venueId: string) => void;
  isFavorite: (venueId: string) => boolean;
  // Map POI — tapped business from Standard style (not a KrowdGuide venue)
  selectedPOI: MapPOI | null;
  selectPOI: (poi: MapPOI) => void;
  closePOISheet: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ city, children }: { city: City; children: ReactNode }) {
  const [selectedCity, setSelectedCity] = useState<City>(city);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('krowd-theme') as 'dark' | 'light') || 'dark';
  });
  const [walkingMode, setWalkingMode] = useState(() => {
    return localStorage.getItem('krowd-walking') === 'true';
  });
  const [smartNotifs, setSmartNotifs] = useState(() => {
    return localStorage.getItem('krowd-notifs') !== 'false';
  });

  const mapRef = useRef<Map | null>(null);
  const [directions, setDirections] = useState<DirectionsState>(INITIAL_DIRECTIONS);
  const [highlightedVenueId, setHighlightedVenueId] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<MapPOI | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('krowd-favorites');
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
    } catch { return new Set(); }
  });

  const toggleFavorite = useCallback((venueId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(venueId)) next.delete(venueId);
      else next.add(venueId);
      localStorage.setItem('krowd-favorites', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isFavorite = useCallback((venueId: string) => favorites.has(venueId), [favorites]);

  /** Select a venue to open its detail sheet + fly map to it */
  const selectVenue = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
    setHighlightedVenueId(venue.id);
    const map = mapRef.current;
    if (map) {
      map.flyTo({
        center: [venue.coordinates[1], venue.coordinates[0]],
        zoom: 16,
        pitch: 45,
        duration: 1200,
      });
    }
    setTimeout(() => setHighlightedVenueId(null), 5000);
  }, []);

  const closeVenueSheet = useCallback(() => { setSelectedVenue(null); }, []);

  /** Open POI detail sheet for a tapped business from Mapbox Standard style */
  const selectPOI = useCallback((poi: MapPOI) => {
    setSelectedPOI(poi);
    setSelectedVenue(null); // close venue sheet if open
    const map = mapRef.current;
    if (map) {
      map.flyTo({
        center: poi.coordinates,
        zoom: 16,
        pitch: 45,
        duration: 800,
      });
    }
  }, []);
  const closePOISheet = useCallback(() => { setSelectedPOI(null); }, []);

  /** Fly the map camera to a venue and highlight it */
  const flyToVenue = useCallback((venue: Venue) => {
    setHighlightedVenueId(venue.id);
    const map = mapRef.current;
    if (map) {
      map.flyTo({
        center: [venue.coordinates[1], venue.coordinates[0]],
        zoom: 16,
        pitch: 45,
        duration: 1200,
      });
    }
    // Auto-clear highlight after 5 seconds
    setTimeout(() => setHighlightedVenueId(null), 5000);
  }, []);

  // Venue data — single source of truth with Oracle live-feed merge
  const { pulse, liveVenue, isLive } = usePulseData();
  const venues = useMemo(() => {
    const base = getVenuesForCity(selectedCity.id);
    if (isLive && liveVenue && selectedCity.id === 'reno') {
      return [liveVenue, ...base.filter(v => v.name !== liveVenue.name)];
    }
    return base;
  }, [selectedCity.id, isLive, liveVenue]);
  const venueById = useMemo(() => {
    const m = new globalThis.Map<string, Venue>();
    venues.forEach(v => m.set(v.id, v));
    return m;
  }, [venues]);

  useEffect(() => {
    localStorage.setItem('krowd-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('krowd-walking', String(walkingMode));
  }, [walkingMode]);

  useEffect(() => {
    localStorage.setItem('krowd-notifs', String(smartNotifs));
  }, [smartNotifs]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  /** Fetch directions from user location to a destination */
  const startDirections = useCallback(async (
    dest: { coords: [number, number]; name: string },
    mode: TravelMode = 'walking'
  ) => {
    // dest.coords is [lat, lng] from venue data — convert to [lng, lat] for Mapbox
    const destLngLat: [number, number] = [dest.coords[1], dest.coords[0]];
    const cityCenter: [number, number] = [selectedCity.coordinates[1], selectedCity.coordinates[0]];

    setDirections({
      active: true,
      origin: null,
      destination: { coords: destLngLat, name: dest.name },
      mode,
      route: null,
      loading: true,
      error: null,
      navigating: false,
      currentStepIndex: 0,
    });

    try {
      const userLoc = await getUserLocation(cityCenter);
      const route = await fetchDirections(userLoc, destLngLat, mode);
      setDirections(prev => ({ ...prev, origin: userLoc, route, loading: false }));
    } catch (err) {
      setDirections(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to get directions',
      }));
    }
  }, [selectedCity]);

  /** Change travel mode and re-fetch route */
  const setDirectionsMode = useCallback((mode: TravelMode) => {
    setDirections(prev => {
      if (!prev.destination || !prev.origin) return prev;
      // Trigger async re-fetch
      const origin = prev.origin;
      const dest = prev.destination.coords;
      (async () => {
        try {
          const route = await fetchDirections(origin, dest, mode);
          setDirections(p => ({ ...p, route, loading: false }));
        } catch (err) {
          setDirections(p => ({
            ...p, loading: false,
            error: err instanceof Error ? err.message : 'Route failed',
          }));
        }
      })();
      return { ...prev, mode, loading: true, error: null };
    });
  }, []);

  const clearDirections = useCallback(() => {
    setDirections(INITIAL_DIRECTIONS);
  }, []);

  const startNavigation = useCallback(() => {
    setDirections(prev => ({ ...prev, navigating: true, currentStepIndex: 0 }));
  }, []);

  const advanceStep = useCallback(() => {
    setDirections(prev => {
      const totalSteps = prev.route?.steps.length ?? 0;
      if (prev.currentStepIndex >= totalSteps - 1) {
        // Past last step — arrival
        return { ...prev, currentStepIndex: totalSteps };
      }
      return { ...prev, currentStepIndex: prev.currentStepIndex + 1 };
    });
  }, []);

  const endNavigation = useCallback(() => {
    setDirections(prev => ({ ...prev, navigating: false, currentStepIndex: 0 }));
  }, []);

  return (
    <AppContext.Provider value={{
      selectedCity, setSelectedCity,
      theme, toggleTheme,
      walkingMode, setWalkingMode,
      smartNotifs, setSmartNotifs,
      mapRef,
      directions, startDirections, setDirectionsMode, clearDirections, startNavigation, advanceStep, endNavigation,
      venues, venueById, pulse, isLive,
      highlightedVenueId, setHighlightedVenueId, flyToVenue,
      selectedVenue, selectVenue, closeVenueSheet,
      selectedPOI, selectPOI, closePOISheet,
      favorites, toggleFavorite, isFavorite,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
