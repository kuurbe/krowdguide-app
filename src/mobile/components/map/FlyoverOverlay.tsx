import { X } from 'lucide-react';

export function FlyoverOverlay({
  waypointName,
  currentIndex,
  totalCount,
  onStop,
}: {
  waypointName: string;
  currentIndex: number;
  totalCount: number;
  onStop: () => void;
}) {
  return (
    <div className="absolute top-24 left-4 right-4 z-[1050] animate-fadeUp">
      <div className="rounded-2xl bg-[var(--k-elevated)] ios-blur-thick border border-[var(--k-border)]
                      shadow-[var(--k-modal-shadow)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold text-[#ff4d6a] uppercase tracking-[0.08em] mb-1">
              Flyover Tour · {currentIndex + 1} of {totalCount}
            </p>
            <p className="text-[18px] font-extrabold text-[var(--k-text)] tracking-tight truncate">
              {waypointName}
            </p>
          </div>
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--k-surface)]
                       border border-[var(--k-border)] text-[var(--k-text-2)] text-[12px] font-bold
                       active:scale-95 transition-transform flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" /> Stop
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-[3px] rounded-full bg-[var(--k-fill-3)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ff4d6a] to-[#a855f7] transition-all duration-700"
            style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
