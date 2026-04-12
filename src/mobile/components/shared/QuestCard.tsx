import { useState, useCallback } from 'react';
import { MapPin, Clock, Zap, Check } from 'lucide-react';
import type { Quest } from '../../data/quests';
import { VenueIcon } from '../../utils/icons';

/**
 * QuestCard — gamified walking tour card with progress meter.
 * Users can "accept" a quest and track completion. XP earned on finish.
 */
export function QuestCard({ quest }: { quest: Quest }) {
  const [accepted, setAccepted] = useState(false);
  const [completedStops, setCompletedStops] = useState(0);

  const handleStart = useCallback(() => {
    setAccepted(true);
  }, []);

  const handleAdvance = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedStops(prev => Math.min(quest.stops, prev + 1));
  }, [quest.stops]);

  const progress = completedStops / quest.stops;
  const isComplete = completedStops === quest.stops;

  return (
    <div
      className="liquid-glass rounded-2xl p-4 relative overflow-hidden ios-press"
      style={{
        boxShadow: accepted
          ? `inset 0 0 0 1px ${quest.accent}33, 0 0 30px -8px ${quest.accent}55`
          : undefined,
      }}
    >
      {/* Accent gradient wash */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${quest.accent}, transparent 60%)`,
        }}
      />

      <div className="relative">
        {/* Header row — emoji + difficulty badge */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
               style={{ background: `${quest.accent}20`, border: `1px solid ${quest.accent}40` }}>
            <VenueIcon iconId={quest.emoji} className="w-5 h-5" style={{ color: quest.accent }} />
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.08em]"
            style={{ background: `${quest.accent}20`, color: quest.accent }}
          >
            {quest.difficulty}
          </span>
        </div>

        {/* Title + subtitle */}
        <h3 className="font-syne text-[17px] font-extrabold text-[var(--k-text)] leading-tight tracking-[-0.01em]">
          {quest.title}
        </h3>
        <p className="text-[12px] text-[var(--k-text-m)] mt-0.5 leading-snug">
          {quest.subtitle}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-3 text-[11px] text-[var(--k-text-m)] font-semibold">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {quest.distance}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {quest.duration}
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                  style={{ background: quest.accent }}>
              {quest.stops}
            </span>
            stops
          </div>
          <div className="ml-auto flex items-center gap-1" style={{ color: quest.accent }}>
            <Zap className="w-3 h-3 fill-current" />
            +{quest.xp} XP
          </div>
        </div>

        {/* Progress bar or CTA */}
        {accepted ? (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-[var(--k-text-m)] uppercase tracking-wider">
                {isComplete ? 'Complete!' : `Stop ${completedStops}/${quest.stops}`}
              </span>
              {!isComplete && (
                <button
                  onClick={handleAdvance}
                  className="text-[10px] font-bold ios-press"
                  style={{ color: quest.accent }}
                >
                  + Mark next
                </button>
              )}
            </div>
            <div className="h-[5px] rounded-full overflow-hidden bg-[var(--k-fill-3)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%`, background: quest.accent }}
              />
            </div>
            {isComplete && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold" style={{ color: quest.accent }}>
                <Check className="w-3.5 h-3.5" />
                +{quest.xp} XP earned
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleStart}
            className="mt-3 w-full py-2 rounded-[12px] text-[12px] font-bold text-white ios-press"
            style={{ background: quest.accent }}
          >
            Start Quest
          </button>
        )}
      </div>
    </div>
  );
}
