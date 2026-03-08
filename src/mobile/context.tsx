import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { City } from './types';

interface AppContextType {
  selectedCity: City;
  setSelectedCity: (city: City) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  walkingMode: boolean;
  setWalkingMode: (v: boolean) => void;
  smartNotifs: boolean;
  setSmartNotifs: (v: boolean) => void;
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

  return (
    <AppContext.Provider value={{
      selectedCity, setSelectedCity,
      theme, toggleTheme,
      walkingMode, setWalkingMode,
      smartNotifs, setSmartNotifs,
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
