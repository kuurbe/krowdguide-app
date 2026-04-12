import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, X, Footprints } from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { speak, cancelSpeech, isVoiceSupported } from '../../utils/voiceGuidance';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface Props {
  visible: boolean;
  cityName: string;
  onDismiss: () => void;
}

export function WalkingModePill({ visible, cityName, onDismiss }: Props) {
  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition();
  const [response, setResponse] = useState<string | null>(null);
  const [processed, setProcessed] = useState('');

  const handleTap = useCallback(() => {
    haptic('medium');
    if (isListening) {
      stopListening();
    } else {
      cancelSpeech();
      setResponse(null);
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // When user finishes speaking, generate a mock response
  useEffect(() => {
    if (!isListening && transcript && transcript !== processed) {
      setProcessed(transcript);
      // Mock AI response — in production this would hit an LLM
      const reply = generateReply(transcript, cityName);
      setResponse(reply);
      if (isVoiceSupported()) speak(reply);
    }
  }, [isListening, transcript, processed, cityName]);

  if (!visible) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed bottom-[88px] left-0 right-0 z-[2500] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-center gap-2 max-w-sm w-full">
        {/* Response bubble */}
        {response && (
          <div className="liquid-glass glass-border-glow rounded-2xl px-4 py-3 w-full">
            <p className="type-overline text-[var(--k-color-coral)] text-[9px] mb-1">KROWD AI</p>
            <p className="text-[13px] text-[var(--k-text)] leading-snug">{response}</p>
          </div>
        )}

        {/* Listening transcript */}
        {isListening && transcript && (
          <div className="liquid-glass rounded-2xl px-4 py-2 w-full">
            <p className="text-[12px] italic text-[var(--k-text-m)]">"{transcript}"</p>
          </div>
        )}

        {/* Main pill */}
        <div className="liquid-glass rounded-full flex items-center gap-2 pl-2 pr-3 py-2 shadow-lg"
             style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 24px rgba(255,77,106,0.4)' }}>
          <button
            onClick={handleTap}
            className={`w-11 h-11 rounded-full flex items-center justify-center ios-press ${isListening ? 'animate-pulse' : ''}`}
            style={{
              background: isListening ? 'var(--k-color-coral)' : 'var(--k-color-coral)',
              boxShadow: isListening ? '0 0 24px rgba(255,77,106,0.8)' : '0 4px 12px rgba(255,77,106,0.4)',
            }}
            aria-label={isListening ? 'Stop listening' : 'Ask KrowdGuide'}
          >
            {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
          </button>

          <div className="flex items-center gap-1.5">
            <Footprints className="w-3 h-3 text-[var(--k-color-coral)]" />
            <span className="text-[11px] font-bold text-[var(--k-text)] uppercase tracking-wider">
              {isListening ? 'Listening…' : 'Walking mode'}
            </span>
          </div>

          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-full glass-chip flex items-center justify-center ios-press"
            aria-label="Exit walking mode"
          >
            <X className="w-3 h-3 text-[var(--k-text-m)]" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Simple mock reply generator — replace with real LLM in production */
function generateReply(prompt: string, city: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('quiet') || lower.includes('calm')) {
    return `There's a calm spot 2 blocks ahead in ${city}. Want directions?`;
  }
  if (lower.includes('coffee') || lower.includes('cafe')) {
    return `I found 3 coffee spots within 5 minutes. The closest has a quiet patio right now.`;
  }
  if (lower.includes('eat') || lower.includes('food') || lower.includes('restaurant')) {
    return `Two dining options nearby with no wait. The closer one is at 65% capacity.`;
  }
  if (lower.includes('bar') || lower.includes('drink')) {
    return `The nearest bar is at 78% crowd — busy. A quieter one is 4 blocks further.`;
  }
  return `I heard you. Tonight in ${city}, the quietest spots are to the north. Want me to guide you?`;
}
