import { useState } from 'react';
import { useAppContext } from '../../context';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { formatDistance } from '../../services/directionsService';
import type { TravelMode } from '../../services/directionsService';
import {
  Navigation, Footprints, Bike, ArrowUp, CornerUpRight, CornerUpLeft,
  Users, Compass, ChevronUp, ChevronDown,
} from 'lucide-react';

const MODES: { id: TravelMode; label: string; Icon: typeof Navigation }[] = [
  { id: 'driving', label: 'DRIVE', Icon: Navigation },
  { id: 'walking', label: 'WALK', Icon: Footprints },
  { id: 'cycling', label: 'BIKE', Icon: Bike },
];

/** Pick a maneuver icon + color based on step type */
function StepIcon({ type, modifier }: { type: string; modifier?: string }) {
  const isTurn = type.includes('turn') || !!modifier?.match(/left|right/);
  const bg = isTurn ? 'bg-[var(--k-color-coral)]' : 'bg-[var(--k-color-green)]';
  const Icon = isTurn
    ? modifier?.includes('left') ? CornerUpLeft : CornerUpRight
    : ArrowUp;

  return (
    <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
  );
}

/** Format duration as just the number of minutes */
function durationMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

/** Format distance as km value */
function distanceKm(meters: number): string {
  return (meters / 1000).toFixed(1);
}

export function DirectionsDrawer() {
  const { directions, setDirectionsMode, clearDirections, startNavigation } = useAppContext();
  const [stepsExpanded, setStepsExpanded] = useState(false);

  if (!directions.active || directions.navigating) return null;

  const route = directions.route;
  const steps = route?.steps ?? [];

  const viaRoad = steps
    .find(s => s.maneuver.type !== 'depart')
    ?.instruction.match(/on (.+?)(?:$|,| for)/)?.[1] ?? 'selected route';

  const totalMin = route ? durationMinutes(route.duration) : 0;
  const totalKm = route ? distanceKm(route.distance) : '0';

  let elapsed = 0;

  return (
    <Drawer open={directions.active && !directions.navigating} onOpenChange={(open) => { if (!open) clearDirections(); }}>
      <DrawerContent className={`liquid-glass glass-border-glow rounded-t-[24px] transition-all duration-300 ${stepsExpanded ? 'max-h-[85vh]' : 'max-h-[45vh]'}`}>
        <DrawerTitle className="sr-only">
          Directions to {directions.destination?.name}
        </DrawerTitle>

        <div className="px-5 pt-3 pb-5 overflow-y-auto no-scrollbar">

          {/* ── Compact header: destination + ETA + mode ── */}
          {route && (
            <>
              {/* Destination + stats row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-[12px] text-[var(--k-color-coral)] font-bold uppercase tracking-wider mb-0.5">
                    {directions.mode === 'walking' ? 'Walking' : directions.mode === 'cycling' ? 'Cycling' : 'Driving'} · {totalKm} km
                  </p>
                  <h2 className="font-syne text-[22px] font-black leading-[1.1] text-[var(--k-text)] tracking-[-0.02em] truncate">
                    {directions.destination?.name}
                  </h2>
                  <p className="text-[12px] text-[var(--k-text-m)] mt-0.5">
                    via {viaRoad}
                  </p>
                </div>

                {/* ETA badge */}
                <div className="flex-shrink-0 text-center px-4 py-2 rounded-2xl bg-[var(--k-color-coral)]/15">
                  <span className="text-[28px] font-syne font-black text-[var(--k-color-coral)] leading-none">{totalMin}</span>
                  <p className="text-[11px] font-bold text-[var(--k-color-coral)] -mt-0.5">min</p>
                </div>
              </div>

              {/* Mode selector */}
              <div className="flex gap-2 mb-4">
                {MODES.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setDirectionsMode(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ios-press text-[12px] font-bold
                      ${directions.mode === id
                        ? 'bg-[var(--k-color-coral)] text-white shadow-md'
                        : 'glass-chip text-[var(--k-text-m)]'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Loading */}
          {directions.loading && (
            <div className="flex items-center justify-center py-6 gap-2 text-[var(--k-text-m)]">
              <div className="w-5 h-5 border-2 border-[var(--k-color-coral)] border-t-transparent rounded-full animate-spin" />
              <span className="text-[13px] font-medium">Finding best route...</span>
            </div>
          )}

          {/* Error */}
          {directions.error && (
            <div className="text-center py-4">
              <p className="text-[var(--k-color-coral)] text-[13px] font-medium">{directions.error}</p>
            </div>
          )}

          {/* Start Navigation button — always visible */}
          {route && !directions.loading && (
            <button
              onClick={startNavigation}
              className="w-full py-3.5 rounded-2xl bg-[var(--k-color-coral)] text-white font-black text-[15px] tracking-wide
                         shadow-[0_4px_20px_rgba(66,133,244,0.35)] active:scale-[0.97] transition-transform flex items-center justify-center gap-2 ios-press mb-3"
            >
              <Compass className="w-5 h-5" />
              START
            </button>
          )}

          {/* Steps toggle */}
          {route && !directions.loading && steps.length > 0 && (
            <button
              onClick={() => setStepsExpanded(v => !v)}
              className="w-full flex items-center justify-center gap-1 py-2 text-[12px] font-bold text-[var(--k-text-m)] ios-press"
            >
              {stepsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              {stepsExpanded ? 'Hide steps' : `${steps.length} steps`}
            </button>
          )}

          {/* Expandable steps list */}
          {stepsExpanded && route && !directions.loading && steps.length > 0 && (
            <div className="mt-2">
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-[2px] bg-[var(--k-border)]" />
                <div className="space-y-0">
                  {steps.map((step, i) => {
                    const isTurn = step.maneuver.type.includes('turn') || !!step.maneuver.modifier?.match(/left|right/);
                    const timeBadge = i === 0 ? 'NOW' : `${durationMinutes(elapsed)} MIN`;
                    elapsed += step.duration;

                    return (
                      <div key={i} className="relative flex items-start gap-3 py-2.5 pl-0">
                        <div className="relative z-10">
                          <StepIcon type={step.maneuver.type} modifier={step.maneuver.modifier} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[var(--k-text)] leading-snug">{step.instruction}</p>
                          <p className="text-[11px] text-[var(--k-text-m)] mt-0.5">{formatDistance(step.distance)}</p>
                          {isTurn && (
                            <div className="flex items-center gap-1 mt-1">
                              <Users className="w-3 h-3 text-[var(--k-color-coral)]" />
                              <span className="text-[9px] font-bold text-[var(--k-color-coral)] uppercase tracking-wider">HIGH CROWD DENSITY</span>
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-[var(--k-color-coral)]/15 text-[var(--k-color-coral)]' : 'bg-[var(--k-surface)] text-[var(--k-text-m)]'}`}>
                          {timeBadge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
