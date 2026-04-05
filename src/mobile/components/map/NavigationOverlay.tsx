import { useState, useEffect, useMemo } from 'react';
import {
  ArrowUp, ArrowUpRight, ArrowUpLeft, MapPin,
  CornerUpRight, CornerUpLeft, RotateCw, GitMerge, Undo2,
  Volume2, VolumeX, ArrowLeft, Mic, Footprints, Flag, Users, X,
} from 'lucide-react';
import { useAppContext } from '../../context';
import { formatDistance, formatDuration } from '../../services/directionsService';
import { speak, cancelSpeech, isVoiceSupported } from '../../utils/voiceGuidance';

/* ── Maneuver icon mapper ─────────────────────────────────────────── */

function ManeuverIcon({ type, modifier, size = 32 }: { type: string; modifier?: string; size?: number }) {
  const style = { width: size, height: size };
  const cls = 'text-white';

  if (type === 'arrive') return <MapPin className={cls} style={style} />;
  if (type === 'roundabout' || type === 'rotary') return <RotateCw className={cls} style={style} />;
  if (type === 'merge') return <GitMerge className={cls} style={style} />;
  if (type === 'turn' && modifier?.includes('uturn')) return <Undo2 className={cls} style={style} />;
  if (modifier?.includes('sharp left')) return <CornerUpLeft className={cls} style={style} />;
  if (modifier?.includes('sharp right')) return <CornerUpRight className={cls} style={style} />;
  if (modifier?.includes('slight left')) return <ArrowUpLeft className={cls} style={style} />;
  if (modifier?.includes('slight right')) return <ArrowUpRight className={cls} style={style} />;
  if (modifier?.includes('left')) return <CornerUpLeft className={cls} style={style} />;
  if (modifier?.includes('right')) return <CornerUpRight className={cls} style={style} />;
  if (type === 'end of road') {
    if (modifier?.includes('left')) return <CornerUpLeft className={cls} style={style} />;
    return <CornerUpRight className={cls} style={style} />;
  }
  return <ArrowUp className={cls} style={style} />;
}

/* ── Tab definitions ──────────────────────────────────────────────── */

type NavTab = 'route' | 'arrival' | 'crowd' | 'exit';

const NAV_TABS: { key: NavTab; label: string; icon: typeof Footprints }[] = [
  { key: 'route',   label: 'ROUTE',   icon: Footprints },
  { key: 'arrival', label: 'ARRIVAL', icon: Flag },
  { key: 'crowd',   label: 'CROWD',   icon: Users },
  { key: 'exit',    label: 'EXIT',    icon: X },
];

/* ── Step crowd color ─────────────────────────────────────────────── */

function stepColor(index: number, total: number, destPct: number): string {
  // Simulate crowd density gradient across route segments
  // Last segments inherit destination crowd level
  const ratio = index / Math.max(total - 1, 1);
  if (destPct > 70) {
    // High density destination — escalate toward red
    if (ratio > 0.7) return '#FF4D6A'; // red/coral
    if (ratio > 0.4) return '#FFB84D'; // amber
    return '#34D399'; // green
  }
  if (destPct > 40) {
    if (ratio > 0.8) return '#FFB84D';
    return '#34D399';
  }
  return '#34D399';
}

/* ── NavigationOverlay ────────────────────────────────────────────── */

export function NavigationOverlay() {
  const { directions, advanceStep, endNavigation, clearDirections, venues, selectedVenue } = useAppContext();
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('route');

  const { route, currentStepIndex, navigating } = directions;

  // Find destination venue to get crowd pct
  const destVenue = useMemo(() => {
    if (selectedVenue) return selectedVenue;
    // Try to match by name
    if (directions.destination?.name) {
      return venues.find(v => v.name === directions.destination!.name) ?? null;
    }
    return null;
  }, [selectedVenue, directions.destination, venues]);

  const destPct = destVenue?.pct ?? 0;

  // Voice guidance on step change
  useEffect(() => {
    if (!voiceEnabled || !navigating || !route) return;
    const step = route.steps[currentStepIndex];
    if (step) speak(step.instruction);
    return () => cancelSpeech();
  }, [currentStepIndex, voiceEnabled, navigating, route]);

  if (!navigating || !route) return null;

  const totalSteps = route.steps.length;
  const arrived = currentStepIndex >= totalSteps;
  const currentStep = arrived ? null : route.steps[currentStepIndex];

  const remainingDistance = arrived
    ? 0
    : route.steps.slice(currentStepIndex).reduce((s, step) => s + step.distance, 0);

  const remainingDuration = arrived
    ? 0
    : route.steps.slice(currentStepIndex).reduce((s, step) => s + step.duration, 0);

  const eta = new Date(Date.now() + remainingDuration * 1000)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const durationMin = Math.max(1, Math.round(remainingDuration / 60));
  const distKm = (remainingDistance / 1000).toFixed(1);

  /* ── Arrival State ──────────────────────────────────────────────── */
  if (arrived) {
    return (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto animate-arrive p-8 rounded-3xl bg-black/80 backdrop-blur-xl text-center max-w-[280px] shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#ff4d6a]/20 to-[#e8364e]/20 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-[#ff4d6a]" />
          </div>
          <h3 className="font-extrabold text-[20px] text-white tracking-[-0.02em]">
            You've arrived!
          </h3>
          <p className="text-[13px] text-white/60 mt-1.5">
            {directions.destination?.name}
          </p>
          <button
            onClick={clearDirections}
            className="mt-5 w-full py-3 rounded-2xl bg-gradient-to-r from-[#ff4d6a] to-[#e8364e] text-white font-bold text-[14px] shadow-[0_4px_20px_rgba(255,77,106,0.3)] active:scale-[0.97] transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  /* ── Active Navigation ──────────────────────────────────────────── */
  return (
    <>
      {/* ══ TOP HEADER BAR ══ */}
      <div
        className="fixed top-0 left-0 right-0 z-[1200]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Header */}
        <div className="bg-black/70 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
          <button
            onClick={endNavigation}
            className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <span className="font-bold text-[16px] text-white tracking-[-0.01em]">
            KrowdGuide Live
          </span>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10 transition-colors"
            aria-label="Voice input"
          >
            <Mic className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Turn Card */}
        <div className="mx-3 mt-2">
          <button
            onClick={advanceStep}
            className="w-full bg-black/60 backdrop-blur-xl rounded-[16px] p-4 text-left active:bg-black/70 transition-colors border border-white/[0.08]"
          >
            {/* Top row: NEXT TURN label + distance badge */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
                Next Turn
              </span>
              <span className="text-[13px] font-bold text-white bg-emerald-500/90 px-2.5 py-0.5 rounded-full">
                {currentStep ? formatDistance(currentStep.distance) : '--'}
              </span>
            </div>

            {/* Instruction */}
            <p className="font-bold text-[18px] text-white leading-snug tracking-[-0.01em]">
              {currentStep?.instruction || '--'}
            </p>

            {/* Crowd density warning chip */}
            {destPct > 70 && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 bg-[#FF4D6A]/20 border border-[#FF4D6A]/30 rounded-full px-3 py-1">
                <Users className="w-3.5 h-3.5 text-[#FF4D6A]" />
                <span className="text-[11px] font-bold text-[#FF4D6A] tracking-wide">
                  HIGH DENSITY AHEAD
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* ══ BOTTOM SECTION ══ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[1200]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="bg-black/80 backdrop-blur-xl border-t border-white/[0.08]">
          {/* Tab content area */}
          <div className="px-5 pt-4 pb-2">
            {activeNavTab === 'route' && (
              <>
                {/* Step progress indicators */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: Math.min(totalSteps, 5) }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-[4px] rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: i < currentStepIndex
                          ? 'rgba(255,255,255,0.2)'
                          : stepColor(i, Math.min(totalSteps, 5), destPct),
                        opacity: i < currentStepIndex ? 0.4 : 1,
                      }}
                    />
                  ))}
                </div>

                {/* Time display row */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-[32px] text-white leading-none tracking-[-0.03em]">
                      {durationMin} min
                    </p>
                    <p className="text-[13px] text-white/50 mt-1 font-medium">
                      {distKm} km &middot; Arriving {eta}
                    </p>
                  </div>

                  {/* Sound toggle */}
                  {isVoiceSupported() && (
                    <button
                      onClick={() => {
                        setVoiceEnabled(v => !v);
                        if (voiceEnabled) cancelSpeech();
                      }}
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
                      aria-label={voiceEnabled ? 'Mute voice' : 'Enable voice'}
                    >
                      {voiceEnabled
                        ? <Volume2 className="w-5 h-5 text-white" />
                        : <VolumeX className="w-5 h-5 text-white/40" />}
                    </button>
                  )}
                </div>

                {/* End Navigation button */}
                <button
                  onClick={endNavigation}
                  className="w-full py-3 rounded-full bg-[#FF4D6A] text-white font-bold text-[15px] active:scale-[0.97] transition-transform shadow-[0_4px_20px_rgba(255,77,106,0.3)]"
                >
                  End Navigation
                </button>
              </>
            )}

            {activeNavTab === 'arrival' && (
              <div className="py-6 text-center">
                <Flag className="w-8 h-8 text-white/40 mx-auto mb-2" />
                <p className="text-[14px] text-white/50 font-medium">
                  Arrival info for {directions.destination?.name || 'destination'}
                </p>
                <p className="text-[12px] text-white/30 mt-1">Coming soon</p>
              </div>
            )}

            {activeNavTab === 'crowd' && (
              <div className="py-6 text-center">
                <Users className="w-8 h-8 text-white/40 mx-auto mb-2" />
                <p className="text-[14px] text-white/50 font-medium">
                  Crowd density: {destPct > 0 ? `${destPct}%` : 'Unknown'}
                </p>
                <p className="text-[12px] text-white/30 mt-1">Real-time crowd data</p>
              </div>
            )}

            {activeNavTab === 'exit' && (
              <div className="py-6 text-center">
                <X className="w-8 h-8 text-white/40 mx-auto mb-2" />
                <p className="text-[14px] text-white/50 font-medium">
                  Exit planning
                </p>
                <p className="text-[12px] text-white/30 mt-1">Coming soon</p>
              </div>
            )}
          </div>

          {/* 4-tab bar */}
          <div className="flex border-t border-white/[0.06]">
            {NAV_TABS.map(tab => {
              const isActive = activeNavTab === tab.key;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveNavTab(tab.key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors ${
                    isActive ? 'text-[#FF4D6A]' : 'text-white/40 active:text-white/60'
                  }`}
                >
                  <TabIcon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                  <span className="text-[10px] font-bold tracking-[0.06em]">{tab.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-[#FF4D6A]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
