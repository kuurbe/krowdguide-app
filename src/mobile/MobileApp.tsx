import { useState, useCallback } from 'react';
import './mobile.css';
import type { City } from './types';
import { CITIES } from './data/cities';
import { AppProvider } from './context';
import { SplashScreen } from './components/onboarding/SplashScreen';
import { CitySelector } from './components/onboarding/CitySelector';
import { IntentScreen } from './components/onboarding/IntentScreen';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNav } from './components/layout/BottomNav';
import { LiveMap } from './components/map/LiveMap';
import { PredictView } from './components/ai/PredictView';
import { AccountView } from './components/account/AccountView';
import { AlertsDrawer } from './components/alerts/AlertsDrawer';

type Stage = 'splash' | 'city' | 'intent' | 'app';

// Match user coords to nearest supported city
function matchCityByCoords(lat: number, lng: number): City | null {
  const MAX_DIST_KM = 80; // ~50 miles
  for (const city of CITIES) {
    const dLat = city.coordinates[0] - lat;
    const dLng = city.coordinates[1] - lng;
    const distKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
    if (distKm < MAX_DIST_KM) return city;
  }
  return null;
}

export default function MobileApp() {
  const [stage, setStage] = useState<Stage>(() => {
    const completed = localStorage.getItem('krowd-onboarded');
    const savedCity = localStorage.getItem('krowd-city');
    if (completed && savedCity) return 'app';
    return 'splash';
  });

  const [selectedCity, setSelectedCity] = useState<City | null>(() => {
    const saved = localStorage.getItem('krowd-city');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('map');
  const [alertsOpen, setAlertsOpen] = useState(false);

  const handleSplashComplete = useCallback((coords?: { lat: number; lng: number }) => {
    if (coords) {
      const matched = matchCityByCoords(coords.lat, coords.lng);
      if (matched) {
        setSelectedCity(matched);
        localStorage.setItem('krowd-city', JSON.stringify(matched));
        setStage('intent');
        return;
      }
    }
    setStage('city');
  }, []);

  const handleCitySelect = useCallback((city: City) => {
    setSelectedCity(city);
    localStorage.setItem('krowd-city', JSON.stringify(city));
    setStage('intent');
  }, []);

  const handleIntentComplete = useCallback(() => {
    localStorage.setItem('krowd-onboarded', 'true');
    setStage('app');
  }, []);

  // Onboarding stages
  if (stage === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (stage === 'city') {
    return <CitySelector onSelect={handleCitySelect} />;
  }

  if (stage === 'intent' && selectedCity) {
    return <IntentScreen city={selectedCity} onComplete={handleIntentComplete} />;
  }

  // Main app
  if (!selectedCity) {
    setStage('city');
    return null;
  }

  return (
    <AppProvider city={selectedCity}>
      <div className="relative w-full h-dvh max-w-md mx-auto bg-[var(--k-bg)] overflow-hidden shadow-2xl">
        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        {/* Main content */}
        <div className="relative h-full flex flex-col z-[1]">
          <MobileHeader onBellClick={() => setAlertsOpen(true)} />

          <div className="flex-1 overflow-hidden">
            {activeTab === 'map' && <LiveMap />}
            {activeTab === 'ai' && <PredictView />}
            {activeTab === 'account' && <AccountView />}
          </div>

          {/* Floating Bottom Nav — only Map and Account */}
          <div className="absolute bottom-4 left-5 right-5 z-[1100]">
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        {/* Alerts Drawer — accessible via bell icon only */}
        <AlertsDrawer open={alertsOpen} onOpenChange={setAlertsOpen} />
      </div>
    </AppProvider>
  );
}
