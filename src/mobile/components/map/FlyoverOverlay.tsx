import { X, SkipForward } from 'lucide-react';
import type { FlyoverPhase } from '../../utils/flyover';

const PHASE_LABELS: Record<FlyoverPhase, string> = {
  idle: '',
  globe: 'Approaching',
  overview: 'City Overview',
  touring: 'Venue Tour',
  returning: 'Returning',
};

export function FlyoverOverlay({
  waypointName,
  currentIndex,
  totalCount,
  phase,
  onStop,
}: {
  waypointName: string;
  currentIndex: number;
  totalCount: number;
  phase: FlyoverPhase;
  onStop: () => void;
}) {
  const phaseLabel = PHASE_LABELS[phase] || '';
  const progress = phase === 'globe' ? 10
    : phase === 'overview' ? 20
    : phase === 'touring' ? 20 + ((currentIndex + 1) / totalCount) * 60
    : phase === 'returning' ? 90
    : 0;

  return (
    <>
      {/* Cinematic letterbox bars */}
      <div className="absolute top-0 left-0 right-0 h-[28px] bg-black/60 z-[1049] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-[28px] bg-black/60 z-[1049] pointer-events-none" />

      {/* Main overlay card */}
      <div className="absolute top-[40px] left-4 right-4 z-[1050] animate-fadeUp">
        <div className="rounded-2xl bg-black/70 ios-blur-thick border border-white/[0.08]
                        shadow-[0_12px_48px_rgba(0,0,0,0.5)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {/* Phase indicator */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold text-[#ff4d6a] uppercase tracking-[0.08em]">
                  {phaseLabel}
                </span>
                {phase === 'touring' && (
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.06em]">
                    · {currentIndex + 1} of {totalCount}
                  </span>
                )}
              </div>
              <p className="text-[18px] font-extrabold text-white tracking-tight truncate leading-tight">
                {waypointName}
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={onStop}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10
                           border border-white/[0.08] text-white/80 text-[12px] font-bold
                           active:scale-95 transition-transform"
              >
                <X className="w-3.5 h-3.5" /> End
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-[3px] rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff4d6a] to-[#a855f7] transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
