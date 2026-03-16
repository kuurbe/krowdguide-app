import { useState, useEffect } from 'react';
import { X, MapPin, Volume2, VolumeX } from 'lucide-react';
import { useAppContext } from '../../context';
import { formatDistance, formatDuration } from '../../services/directionsService';
import { ManeuverIcon } from './ManeuverIcon';
import { speak, cancelSpeech, isVoiceSupported } from '../../utils/voiceGuidance';

export function NavigationOverlay() {
  const { directions, advanceStep, endNavigation, clearDirections } = useAppContext();
  const [showHint, setShowHint] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const { route, currentStepIndex, navigating } = directions;

  // Hide hint after 3 seconds
  useEffect(() => {
    if (!navigating) return;
    setShowHint(true);
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, [navigating]);

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
  const nextStep = currentStepIndex + 1 < totalSteps ? route.steps[currentStepIndex + 1] : null;

  // Remaining time/distance
  const remainingDuration = arrived ? 0 : route.steps.slice(currentStepIndex).reduce((s, step) => s + step.duration, 0);
  const remainingDistance = arrived ? 0 : route.steps.slice(currentStepIndex).reduce((s, step) => s + step.distance, 0);

  // Arrival state
  if (arrived) {
    return (
      <div className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto animate-arrive p-8 rounded-3xl liquid-glass glass-border-glow text-center max-w-[280px]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#ff4d6a]/15 to-[#a855f7]/15
                          flex items-center justify-center border border-white/[0.06]">
            <MapPin className="w-8 h-8 text-[#ff4d6a]" />
          </div>
          <h3 className="font-syne font-extrabold text-[20px] text-[var(--k-text)] tracking-[-0.02em]">
            You've arrived!
          </h3>
          <p className="text-[13px] text-[var(--k-text-m)] mt-1.5">
            {directions.destination?.name}
          </p>
          <button
            onClick={clearDirections}
            className="mt-5 w-full py-3 rounded-2xl bg-gradient-to-r from-[#ff4d6a] to-[#a855f7] text-white font-bold text-[14px]
                       shadow-[0_4px_20px_rgba(255,77,106,0.3)] active:scale-[0.97] transition-transform ios-press"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Exit button — top right */}
      <div className="absolute top-14 right-4 z-[201]">
        <button
          onClick={endNavigation}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-chip border border-white/[0.08]
                     text-[12px] font-bold text-[var(--k-text)] active:scale-95 transition-transform ios-press"
        >
          <X className="w-3.5 h-3.5" />
          End
        </button>
      </div>

      {/* Voice toggle — top left */}
      {isVoiceSupported() && (
        <div className="absolute top-14 left-4 z-[201]">
          <button
            onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabled) cancelSpeech(); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-chip border border-white/[0.08]
                       text-[12px] font-bold text-[var(--k-text)] active:scale-95 transition-transform ios-press"
          >
            {voiceEnabled
              ? <Volume2 className="w-3.5 h-3.5 text-[#22d3ee]" />
              : <VolumeX className="w-3.5 h-3.5 text-[var(--k-text-f)]" />
            }
          </button>
        </div>
      )}

      {/* Bottom navigation card */}
      <div className="absolute bottom-20 left-3 right-3 z-[200]">
        {/* Progress bar */}
        <div className="mb-2 px-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-[var(--k-text-m)] uppercase tracking-wider">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
            <span className="text-[10px] font-medium text-[var(--k-text-f)]">
              {formatDuration(remainingDuration)} · {formatDistance(remainingDistance)}
            </span>
          </div>
          <div className="flex gap-[3px] h-[4px]">
            {route.steps.map((_, i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-300 ${
                  i < currentStepIndex
                    ? 'bg-[#22d3ee]'
                    : i === currentStepIndex
                    ? 'bg-[#22d3ee] nav-step-active'
                    : 'bg-[var(--k-fill-3)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step card */}
        <button
          onClick={advanceStep}
          className="w-full rounded-2xl liquid-glass glass-border-glow p-4 text-left
                     active:scale-[0.98] transition-transform ios-press animate-step-change"
          key={currentStepIndex} // Re-mount for animation
        >
          {/* Current step */}
          {currentStep && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#22d3ee]/15 flex items-center justify-center flex-shrink-0 border border-[#22d3ee]/20">
                <ManeuverIcon
                  type={currentStep.maneuver.type}
                  modifier={currentStep.maneuver.modifier}
                  size={24}
                  active
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-[var(--k-text)] leading-[1.3] tracking-[-0.01em]">
                  {currentStep.instruction}
                </p>
                <p className="text-[12px] text-[var(--k-text-m)] mt-1 font-medium">
                  {formatDistance(currentStep.distance)}
                </p>
              </div>
            </div>
          )}

          {/* Divider + next step preview */}
          {nextStep && (
            <>
              <div className="h-px bg-[var(--k-border-s)] my-3" />
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[var(--k-surface)] flex items-center justify-center flex-shrink-0">
                  <ManeuverIcon type={nextStep.maneuver.type} modifier={nextStep.maneuver.modifier} size={14} />
                </div>
                <p className="text-[11px] text-[var(--k-text-f)] font-medium truncate">
                  <span className="text-[var(--k-text-m)]">Then:</span> {nextStep.instruction}
                </p>
              </div>
            </>
          )}

          {/* Tap hint */}
          {showHint && currentStepIndex === 0 && (
            <p className="text-center text-[10px] text-[var(--k-text-f)] mt-2.5 animate-fadeUp">
              Tap to advance to next step
            </p>
          )}
        </button>
      </div>
    </>
  );
}
