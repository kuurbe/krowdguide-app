import { useState, useCallback, lazy, Suspense } from 'react';
import './mobile.css';
import type { City } from './types';
import { CITIES } from './data/cities';
import { AppProvider, useAppContext } from './context';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { SplashScreen } from './components/onboarding/SplashScreen';
import { CitySelector } from './components/onboarding/CitySelector';
import { IntentScreen } from './components/onboarding/IntentScreen';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNav } from './components/layout/BottomNav';

// ── Code-split heavy views — only loaded when tab activates ──
const LiveMap = lazy(() => import('./components/map/LiveMap').then(m => ({ default: m.LiveMap })));
const PredictView = lazy(() => import('./components/ai/PredictView').then(m => ({ default: m.PredictView })));
const AccountView = lazy(() => import('./components/account/AccountView').then(m => ({ default: m.AccountView })));
const AlertsDrawer = lazy(() => import('./components/alerts/AlertsDrawer').then(m => ({ default: m.AlertsDrawer })));
const CityGuideDrawer = lazy(() => import('./components/map/CityGuideDrawer').then(m => ({ default: m.CityGuideDrawer })));
const DirectionsDrawer = lazy(() => import('./components/map/DirectionsDrawer').then(m => ({ default: m.DirectionsDrawer })));
const VenueDetailSheet = lazy(() => import('./components/map/VenueDetailSheet').then(m => ({ default: m.VenueDetailSheet })));

type Stage = 'splash' | 'city' | 'intent' | 'app';

/** Skeleton placeholder shown while lazy chunks load */
function ViewSkeleton() {
  return (
    <div className="h-full flex items-center justify-center bg-[var(--k-bg)]">
      <div className="w-12 h-12 rounded-2xl skeleton-shimmer" />
    </div>
  );
}

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
  const [cityGuideOpen, setCityGuideOpen] = useState(false);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

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
    <ErrorBoundary name="KrowdGuide">
      <AppProvider city={selectedCity}>
        <AppShell
          activeTab={activeTab}
          onTabChange={handleTabChange}
          alertsOpen={alertsOpen}
          setAlertsOpen={setAlertsOpen}
          cityGuideOpen={cityGuideOpen}
          setCityGuideOpen={setCityGuideOpen}
        />
      </AppProvider>
    </ErrorBoundary>
  );
}

/** Inner shell — lives inside AppProvider so it can access context */
function AppShell({
  activeTab, onTabChange, alertsOpen, setAlertsOpen, cityGuideOpen, setCityGuideOpen,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  alertsOpen: boolean;
  setAlertsOpen: (v: boolean) => void;
  cityGuideOpen: boolean;
  setCityGuideOpen: (v: boolean) => void;
}) {
  const { selectedVenue, closeVenueSheet } = useAppContext();

  return (
    <div className="relative w-full h-dvh bg-[var(--k-bg)] overflow-hidden">
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
          {/* LiveMap stays mounted (hidden) to preserve Mapbox instance */}
          <div className={activeTab === 'map' ? 'h-full' : 'hidden'}>
            <ErrorBoundary name="Map">
              <Suspense fallback={<ViewSkeleton />}>
                <LiveMap onKGClick={() => setCityGuideOpen(true)} />
              </Suspense>
            </ErrorBoundary>
          </div>

          {activeTab === 'ai' && (
            <ErrorBoundary name="Predict">
              <Suspense fallback={<ViewSkeleton />}>
                <PredictView />
              </Suspense>
            </ErrorBoundary>
          )}

          {activeTab === 'account' && (
            <ErrorBoundary name="Account">
              <Suspense fallback={<ViewSkeleton />}>
                <AccountView />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>

        {/* Floating Bottom Nav */}
        <div className="absolute bottom-4 left-5 right-5 z-[1100] max-w-lg mx-auto safe-bottom">
          <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </div>

      {/* Drawers & sheets — lazy loaded, wrapped in error boundaries */}
      <Suspense fallback={null}>
        <ErrorBoundary name="Alerts">
          <AlertsDrawer open={alertsOpen} onOpenChange={setAlertsOpen} />
        </ErrorBoundary>
      </Suspense>

      <Suspense fallback={null}>
        <ErrorBoundary name="City Guide">
          <CityGuideDrawer open={cityGuideOpen} onOpenChange={setCityGuideOpen} />
        </ErrorBoundary>
      </Suspense>

      <Suspense fallback={null}>
        <ErrorBoundary name="Directions">
          <DirectionsDrawer />
        </ErrorBoundary>
      </Suspense>

      <Suspense fallback={null}>
        <ErrorBoundary name="Venue Detail">
          <VenueDetailSheet venue={selectedVenue} onClose={closeVenueSheet} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}
