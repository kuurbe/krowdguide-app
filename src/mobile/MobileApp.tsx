import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import './mobile.css';
import type { City } from './types';
import { CITIES } from './data/cities';
import { AppProvider, useAppContext } from './context';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
// SplashScreen replaced by inline geo-detect loading
import { CitySelector } from './components/onboarding/CitySelector';
import { IntentScreen } from './components/onboarding/IntentScreen';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNav } from './components/layout/BottomNav';
import { SearchResultsCarousel } from './components/map/SearchResultsCarousel';
import { LayerSelector } from './components/map/LayerSelector';
import { InstallPrompt } from './components/shared/InstallPrompt';
import { CommandPalette } from './components/search/CommandPalette';
import { WalkingModePill } from './components/shared/WalkingModePill';
import { useWalkingMode } from './hooks/useWalkingMode';
import { LeaveNowToast } from './components/shared/LeaveNowToast';

// ── Code-split heavy views — only loaded when tab activates ──
const LiveMap = lazy(() => import('./components/map/LiveMap').then(m => ({ default: m.LiveMap })));
const PredictView = lazy(() => import('./components/ai/PredictView').then(m => ({ default: m.PredictView })));
const AccountView = lazy(() => import('./components/account/AccountView').then(m => ({ default: m.AccountView })));
const AlertsDrawer = lazy(() => import('./components/alerts/AlertsDrawer').then(m => ({ default: m.AlertsDrawer })));
const CityGuideDrawer = lazy(() => import('./components/map/CityGuideDrawer').then(m => ({ default: m.CityGuideDrawer })));
const DirectionsDrawer = lazy(() => import('./components/map/DirectionsDrawer').then(m => ({ default: m.DirectionsDrawer })));
const VenueDetailSheet = lazy(() => import('./components/map/VenueDetailSheet').then(m => ({ default: m.VenueDetailSheet })));
const POIDetailSheet = lazy(() => import('./components/map/POIDetailSheet').then(m => ({ default: m.POIDetailSheet })));

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
    const savedCity = localStorage.getItem('krowd-city');
    if (savedCity) return 'app';
    // Try geolocation first, fall back to city selector
    return 'splash';
  });

  const [selectedCity, setSelectedCity] = useState<City | null>(() => {
    const saved = localStorage.getItem('krowd-city');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return null;
  });

  // Auto-detect city via geolocation on first visit
  useEffect(() => {
    if (stage !== 'splash') return;
    let cancelled = false;

    // Try geolocation with a 5s timeout
    const timeout = setTimeout(() => {
      if (!cancelled) setStage('city'); // Fallback to manual selector
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        clearTimeout(timeout);
        const matched = matchCityByCoords(pos.coords.latitude, pos.coords.longitude);
        if (matched) {
          setSelectedCity(matched);
          localStorage.setItem('krowd-city', JSON.stringify(matched));
          localStorage.setItem('krowd-onboarded', 'true');
          setStage('app');
        } else {
          setStage('city'); // No matching city nearby
        }
      },
      () => {
        if (!cancelled) {
          clearTimeout(timeout);
          setStage('city'); // Permission denied or error
        }
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 }
    );

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [stage]);

  const [activeTab, setActiveTab] = useState('map');
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [cityGuideOpen, setCityGuideOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleCitySelect = useCallback((city: City) => {
    setSelectedCity(city);
    localStorage.setItem('krowd-city', JSON.stringify(city));
    localStorage.setItem('krowd-onboarded', 'true');
    setStage('app');
  }, []);

  const handleIntentComplete = useCallback(() => {
    localStorage.setItem('krowd-onboarded', 'true');
    setStage('app');
  }, []);

  // Onboarding stages
  if (stage === 'splash') {
    // Brief loading while geolocation auto-detects
    return (
      <div className="h-dvh bg-[var(--k-bg)] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#ff4d6a]/15 flex items-center justify-center">
          <span className="text-[20px] font-black text-[#ff4d6a] font-syne">KG</span>
        </div>
        <p className="font-syne font-bold text-[var(--k-text)] text-[16px]">Detecting your city...</p>
        <div className="w-8 h-8 border-2 border-[var(--k-border)] border-t-[#ff4d6a] rounded-full animate-spin" />
      </div>
    );
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
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
        />
      </AppProvider>
    </ErrorBoundary>
  );
}

/** Inner shell — lives inside AppProvider so it can access context */
function AppShell({
  activeTab, onTabChange, alertsOpen, setAlertsOpen, cityGuideOpen, setCityGuideOpen, searchOpen, setSearchOpen,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  alertsOpen: boolean;
  setAlertsOpen: (v: boolean) => void;
  cityGuideOpen: boolean;
  setCityGuideOpen: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
}) {
  const { selectedVenue, closeVenueSheet, selectVenue, venues, selectedCity, directions } = useAppContext();
  const [searchResults, setSearchResults] = useState<typeof venues>([]);
  const { isWalking } = useWalkingMode();
  const [walkingDismissed, setWalkingDismissed] = useState(false);

  // Reset dismissal when user stops walking, so the pill shows again on next walk
  useEffect(() => {
    if (!isWalking && walkingDismissed) setWalkingDismissed(false);
  }, [isWalking, walkingDismissed]);

  // Clear search results on tab change
  const handleTabChange = useCallback((tab: string) => {
    setSearchResults([]);
    onTabChange(tab);
  }, [onTabChange]);

  const handleSearchVenueSelect = useCallback((venue: typeof venues[0]) => {
    setSearchResults([]);
    selectVenue(venue);
  }, [selectVenue]);

  return (
    <div className="relative w-full h-dvh bg-[var(--k-bg)] overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Main content */}
      <div className="relative h-full flex flex-col z-[1] safe-left safe-right">
        <MobileHeader onBellClick={() => setAlertsOpen(true)} />

        <div className="flex-1 overflow-hidden">
          {/* LiveMap stays mounted (hidden) to preserve Mapbox instance */}
          <div className={activeTab === 'map' ? 'h-full' : 'hidden'}>
            <ErrorBoundary name="Map">
              <Suspense fallback={<ViewSkeleton />}>
                <LiveMap onKGClick={() => setCityGuideOpen(true)} onSearchResults={setSearchResults} />
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

        {/* Map overlays — only visible on map tab */}
        {activeTab === 'map' && (
          <>
            {/* Layer selector FAB — bottom left */}
            <LayerSelector />

            {/* Search results carousel — above nav */}
            <SearchResultsCarousel
              venues={searchResults}
              onSelect={handleSearchVenueSelect}
              onClear={() => setSearchResults([])}
            />
          </>
        )}

        {/* Floating Bottom Nav — tight width to show liquid glass */}
        <div className="absolute bottom-4 z-[1100] safe-bottom"
             style={{ left: '50%', transform: 'translateX(-50%)', width: 'min(240px, 68vw)' }}>
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
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

      <Suspense fallback={null}>
        <ErrorBoundary name="POI Detail">
          <POIDetailSheet />
        </ErrorBoundary>
      </Suspense>

      {/* Global search palette — rendered at root level to avoid overflow clipping */}
      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        venues={venues}
        onVenueSelect={(venue) => { selectVenue(venue); setSearchOpen(false); }}
        onSearchResults={(results) => { setSearchResults(results); setSearchOpen(false); }}
      />

      {/* Voice-first walking mode pill */}
      <WalkingModePill
        visible={isWalking && !walkingDismissed && !directions.navigating}
        cityName={selectedCity.name}
        onDismiss={() => setWalkingDismissed(true)}
      />

      {/* Leave Now smart nudge */}
      <LeaveNowToast
        venues={venues}
        onAct={(venue) => {
          selectVenue(venue);
        }}
        enabled={!directions.navigating}
      />

      {/* PWA install prompt */}
      <InstallPrompt />
    </div>
  );
}
