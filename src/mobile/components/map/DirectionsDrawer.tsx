import { useAppContext } from '../../context';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { formatDistance } from '../../services/directionsService';
import type { TravelMode } from '../../services/directionsService';
import {
  Navigation, Footprints, Bike, ArrowUp, CornerUpRight, CornerUpLeft,
  Users, Compass,
} from 'lucide-react';

const MODES: { id: TravelMode; label: string; Icon: typeof Navigation }[] = [
  { id: 'driving', label: 'DRIVE', Icon: Navigation },
  { id: 'walking', label: 'WALK', Icon: Footprints },
  { id: 'cycling', label: 'BIKE', Icon: Bike },
];

/** Pick a maneuver icon + color based on step type */
function StepIcon({ type, modifier }: { type: string; modifier?: string }) {
  const isTurn = type.includes('turn') || !!modifier?.match(/left|right/);
  const bg = isTurn ? 'bg-[#ff4d6a]' : 'bg-[#34d399]';
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

  if (!directions.active || directions.navigating) return null;

  const route = directions.route;
  const steps = route?.steps ?? [];

  // Extract "via" road from first meaningful step
  const viaRoad = steps
    .find(s => s.maneuver.type !== 'depart')
    ?.instruction.match(/on (.+?)(?:$|,| for)/)?.[1] ?? 'selected route';

  const totalMin = route ? durationMinutes(route.duration) : 0;
  const totalKm = route ? distanceKm(route.distance) : '0';

  // Accumulate elapsed time per step for the time badges
  let elapsed = 0;

  return (
    <Drawer open={directions.active && !directions.navigating} onOpenChange={(open) => { if (!open) clearDirections(); }}>
      <DrawerContent className="max-h-[85vh] liquid-glass glass-border-glow rounded-t-[24px]">
        <DrawerTitle className="sr-only">
          Directions to {directions.destination?.name}
        </DrawerTitle>

        <div className="px-5 pt-3 pb-5 overflow-y-auto no-scrollbar">

          {/* ── Header: route name + stats ── */}
          {route && (
            <div className="flex items-start justify-between mb-4">
              {/* Left: route name + subtitle */}
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="font-syne text-[28px] font-black leading-[1.05] text-[var(--k-text)] tracking-[-0.02em]">
                  Via {viaRoad}
                </h2>
                <p className="text-[13px] text-[var(--k-text-m)] mt-1 leading-snug">
                  Fastest route despite light crowd activity
                </p>
              </div>

              {/* Right: duration + distance */}
              <div className="flex items-start gap-3 flex-shrink-0">
                {/* Duration */}
                <div className="flex flex-col items-center">
                  <span className="text-[36px] font-syne font-black text-[#ff4d6a] leading-none tracking-tight">
                    {totalMin}
                  </span>
                  <span className="text-[14px] font-semibold text-[#ff4d6a] -mt-0.5">min</span>
                </div>
                {/* Distance */}
                <div className="flex flex-col items-center">
                  <span className="text-[18px] font-bold text-[#34d399] leading-none mt-2">
                    {totalKm}
                  </span>
                  <span className="text-[12px] font-semibold text-[#34d399] mt-0.5">KM</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Mode selector pills ── */}
          <div className="flex gap-2 mb-5">
            {MODES.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setDirectionsMode(id)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl transition-all ios-press
                  ${directions.mode === id
                    ? 'glass-chip border border-white/30 text-[var(--k-text)]'
                    : 'bg-[var(--k-surface)]/40 text-[var(--k-text-m)]'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-bold tracking-wider">{label}</span>
              </button>
            ))}
          </div>

          {/* ── Loading state ── */}
          {directions.loading && (
            <div className="flex items-center justify-center py-8 gap-2 text-[var(--k-text-m)]">
              <div className="w-5 h-5 border-2 border-[#ff4d6a] border-t-transparent rounded-full animate-spin" />
              <span className="text-[13px] font-medium">Finding best route...</span>
            </div>
          )}

          {/* ── Error state ── */}
          {directions.error && (
            <div className="text-center py-6">
              <p className="text-[#ff4d6a] text-[13px] font-medium">{directions.error}</p>
            </div>
          )}

          {/* ── Route manoeuvres ── */}
          {route && !directions.loading && steps.length > 0 && (
            <div className="mb-5">
              <p className="type-overline mb-3">ROUTE MANOEUVRES</p>

              <div className="relative">
                {/* Vertical connector line */}
                <div className="absolute left-4 top-4 bottom-4 w-[2px] bg-[var(--k-border)]" />

                <div className="space-y-0">
                  {steps.map((step, i) => {
                    const isTurn = step.maneuver.type.includes('turn') || !!step.maneuver.modifier?.match(/left|right/);
                    const timeBadge = i === 0 ? 'NOW' : `${durationMinutes(elapsed)} MIN`;
                    // Track elapsed AFTER reading it for this step
                    elapsed += step.duration;

                    return (
                      <div key={i} className="relative flex items-start gap-3 py-3 pl-0">
                        {/* Icon */}
                        <div className="relative z-10">
                          <StepIcon type={step.maneuver.type} modifier={step.maneuver.modifier} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-[var(--k-text)] leading-snug">
                            {step.instruction}
                          </p>
                          <p className="text-[12px] text-[var(--k-text-m)] mt-0.5">
                            Continue for {formatDistance(step.distance)}
                          </p>

                          {/* Crowd density badge on turn steps */}
                          {isTurn && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Users className="w-3 h-3 text-[#ff4d6a]" />
                              <span className="text-[10px] font-bold text-[#ff4d6a] uppercase tracking-wider">
                                HIGH CROWD DENSITY
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Time badge */}
                        <div className="flex-shrink-0 mt-0.5">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full
                            ${i === 0
                              ? 'bg-[#ff4d6a]/15 text-[#ff4d6a]'
                              : 'bg-[var(--k-surface)] text-[var(--k-text-m)]'
                            }`}>
                            {timeBadge}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Start Navigation button ── */}
          {route && !directions.loading && (
            <button
              onClick={startNavigation}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff4d6a] to-[#ff6b81] text-white font-black text-[16px] tracking-wide
                         shadow-[0_4px_24px_rgba(255,77,106,0.35)] active:scale-[0.97] transition-transform flex items-center justify-center gap-2.5 ios-press"
            >
              <Compass className="w-5 h-5" />
              START NAVIGATION
            </button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
