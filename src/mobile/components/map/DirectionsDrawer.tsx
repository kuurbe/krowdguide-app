import { useState } from 'react';
import { useAppContext } from '../../context';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { formatDistance, formatDuration } from '../../services/directionsService';
import type { TravelMode } from '../../services/directionsService';
import { X, Car, Footprints, Bike, Loader2, CornerDownLeft, CornerDownRight, MoveUp, MapPin, ChevronUp, ChevronDown } from 'lucide-react';

const MODES: { id: TravelMode; label: string; Icon: typeof Car }[] = [
  { id: 'driving', label: 'Drive', Icon: Car },
  { id: 'walking', label: 'Walk', Icon: Footprints },
  { id: 'cycling', label: 'Bike', Icon: Bike },
];

function stepIcon(type: string, modifier?: string) {
  if (type === 'arrive' || type === 'depart') return <MapPin className="w-4 h-4 text-[#ff4d6a]" />;
  if (modifier?.includes('left')) return <CornerDownLeft className="w-4 h-4 text-[var(--k-text-2)]" />;
  if (modifier?.includes('right')) return <CornerDownRight className="w-4 h-4 text-[var(--k-text-2)]" />;
  return <MoveUp className="w-4 h-4 text-[var(--k-text-2)]" />;
}

export function DirectionsDrawer() {
  const { directions, setDirectionsMode, clearDirections } = useAppContext();
  const [stepsExpanded, setStepsExpanded] = useState(false);

  if (!directions.active) return null;

  return (
    <Drawer open={directions.active} onOpenChange={(open) => { if (!open) clearDirections(); }}>
      <DrawerContent className="max-h-[65vh] max-w-md mx-auto bg-[var(--k-bg)] border-[var(--k-border)] rounded-t-[24px]">
        <DrawerTitle className="sr-only">
          Directions to {directions.destination?.name}
        </DrawerTitle>

        <div className="px-5 pt-2 pb-5">
          {/* Close button */}
          <div className="flex justify-end mb-2">
            <button
              onClick={clearDirections}
              className="w-7 h-7 rounded-full bg-[var(--k-surface)] flex items-center justify-center active:scale-90 transition-transform"
            >
              <X className="w-3.5 h-3.5 text-[var(--k-text-m)]" />
            </button>
          </div>

          {/* From / To with dot indicators */}
          <div className="flex gap-3 mb-4">
            {/* Dot rail */}
            <div className="flex flex-col items-center pt-1.5 gap-0">
              <div className="w-3 h-3 rounded-full bg-[#22d3ee] border-2 border-[#22d3ee]/30 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
              <div className="w-[2px] flex-1 my-1 bg-gradient-to-b from-[#22d3ee]/40 to-[#ff4d6a]/40" />
              <div className="w-3 h-3 rounded-full bg-[#ff4d6a] border-2 border-[#ff4d6a]/30 shadow-[0_0_8px_rgba(255,77,106,0.4)]" />
            </div>

            {/* Labels */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              <div>
                <p className="text-[11px] text-[var(--k-text-f)] font-medium uppercase tracking-wider">From</p>
                <p className="text-[14px] text-[var(--k-text)] font-semibold tracking-[-0.01em]">My position</p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--k-text-f)] font-medium uppercase tracking-wider">To</p>
                <p className="text-[14px] text-[var(--k-text)] font-semibold truncate tracking-[-0.01em]">
                  {directions.destination?.name}
                </p>
              </div>
            </div>

            {/* Duration / Distance badge */}
            {directions.route && !directions.loading && (
              <div className="flex flex-col items-end justify-center gap-0.5 flex-shrink-0">
                <p className="text-[22px] font-black text-[var(--k-text)] tracking-[-0.04em] leading-none">
                  {formatDuration(directions.route.duration)}
                </p>
                <p className="text-[12px] text-[var(--k-text-m)] font-medium">
                  {formatDistance(directions.route.distance)}
                </p>
              </div>
            )}
          </div>

          {/* Mode selector — icon squares */}
          <div className="flex gap-2.5 mb-4">
            {MODES.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setDirectionsMode(id)}
                className={`flex flex-col items-center justify-center w-[72px] h-[62px] rounded-2xl transition-all ios-press
                  ${directions.mode === id
                    ? 'bg-gradient-to-br from-[#ff4d6a] to-[#a855f7] text-white shadow-[0_4px_20px_rgba(255,77,106,0.35)]'
                    : 'bg-[var(--k-surface)] border border-[var(--k-border)] text-[var(--k-text-2)] hover:border-[var(--k-text-f)]'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{label}</span>
              </button>
            ))}

            {/* Uber link */}
            {directions.destination && (
              <a
                href={`https://m.uber.com/ul/?pickup=my_location&dropoff[latitude]=${directions.destination.coords[1]}&dropoff[longitude]=${directions.destination.coords[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center w-[72px] h-[62px] rounded-2xl bg-[var(--k-surface)] border border-[var(--k-border)] text-[var(--k-text-2)] hover:border-[var(--k-text-f)] transition-all ios-press"
              >
                <span className="text-[18px] font-black">U</span>
                <span className="text-[10px] font-bold mt-0.5 uppercase tracking-wider">Uber</span>
              </a>
            )}
          </div>

          {/* GO button */}
          {directions.route && !directions.loading && (
            <button
              onClick={() => setStepsExpanded(prev => !prev)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#22d3ee] to-[#22d3ee]/80 text-white font-black text-[16px] tracking-wide
                         shadow-[0_4px_20px_rgba(34,211,238,0.3)] active:scale-[0.97] transition-transform flex items-center justify-center gap-2 mb-3"
            >
              {stepsExpanded ? 'HIDE STEPS' : 'GO'}
              {stepsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}

          {/* Loading state */}
          {directions.loading && (
            <div className="flex items-center justify-center py-6 gap-2 text-[var(--k-text-m)]">
              <Loader2 className="w-5 h-5 animate-spin text-[#22d3ee]" />
              <span className="text-[13px] font-medium">Finding best route...</span>
            </div>
          )}

          {/* Error state */}
          {directions.error && (
            <div className="text-center py-6">
              <p className="text-[#ff4d6a] text-[13px] font-medium">{directions.error}</p>
            </div>
          )}

          {/* Turn-by-turn steps (collapsible) */}
          {stepsExpanded && directions.route && !directions.loading && (
            <div className="max-h-[22vh] overflow-y-auto space-y-0 border-t border-[var(--k-border-s)] pt-2">
              {directions.route.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2.5 border-b border-[var(--k-border-s)] last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--k-surface)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {stepIcon(step.maneuver.type, step.maneuver.modifier)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[var(--k-text)] leading-[1.35]">{step.instruction}</p>
                    <p className="text-[11px] text-[var(--k-text-f)] mt-0.5">
                      {formatDistance(step.distance)} · {formatDuration(step.duration)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
