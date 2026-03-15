import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { Map } from 'mapbox-gl';
import type { City } from './types';
import type { TravelMode, DirectionsRoute } from './services/directionsService';
import { fetchDirections } from './services/directionsService';
import { getUserLocation } from './utils/userLocation';

export interface DirectionsState {
  active: boolean;
  origin: [number, number] | null;
  destination: { coords: [number, number]; name: string } | null;
  mode: TravelMode;
  route: DirectionsRoute | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_DIRECTIONS: DirectionsState = {
  active: false,
  origin: null,
  destination: null,
  mode: 'walking',
  route: null,
  loading: false,
  error: null,
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
  // Map ref — shared so directions/flyover can control the camera
  mapRef: React.MutableRefObject<Map | null>;
  // Directions
  directions: DirectionsState;
  startDirections: (dest: { coords: [number, number]; name: string }, mode?: TravelMode) => void;
  setDirectionsMode: (mode: TravelMode) => void;
  clearDirections: () => void;
  // Flyover
  flyoverActive: boolean;
  setFlyoverActive: (v: boolean) => void;
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
  const [flyoverActive, setFlyoverActive] = useState(false);

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

  return (
    <AppContext.Provider value={{
      selectedCity, setSelectedCity,
      theme, toggleTheme,
      walkingMode, setWalkingMode,
      smartNotifs, setSmartNotifs,
      mapRef,
      directions, startDirections, setDirectionsMode, clearDirections,
      flyoverActive, setFlyoverActive,
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
