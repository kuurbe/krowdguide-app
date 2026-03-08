/* IntentScreen v3 — Premium nightlife design with category cards */
import { useState, useEffect } from 'react';
import { Mic, MicOff, Send, Sparkles, Search, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import type { City } from '../../types';

const QUICK_INTENTS = [
  { label: 'Events going on', icon: '🎉', color: 'from-[#ff4d6a] to-[#ff8c42]', desc: 'Live & upcoming' },
  { label: 'Best places to eat', icon: '🍽️', color: 'from-[#22d3ee] to-[#0891b2]', desc: 'Top rated spots' },
  { label: 'Bars & nightlife', icon: '🍸', color: 'from-[#a855f7] to-[#7c3aed]', desc: 'Trending tonight' },
  { label: 'Things to do', icon: '📍', color: 'from-[#f97316] to-[#ef4444]', desc: 'Explore the city' },
  { label: 'Venues nearby', icon: '🏟️', color: 'from-[#06b6d4] to-[#8b5cf6]', desc: 'Within walking distance' },
  { label: 'Happy hour deals', icon: '🍻', color: 'from-[#eab308] to-[#f97316]', desc: 'Active specials' },
];

export function IntentScreen({ city, onComplete }: { city: City; onComplete: (intent?: string) => void }) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'type' | 'talk'>('type');
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;
    onComplete(text.trim());
  };

  const handleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      setMode('talk');
      startListening();
    }
  };

  useEffect(() => {
    if (transcript && !isListening) {
      handleSubmit(transcript);
    }
  }, [transcript, isListening]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-dvh w-full max-w-md mx-auto bg-[#050508] flex flex-col px-5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col pt-16 pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ff4d6a]/20 to-[#a855f7]/15
                            flex items-center justify-center border border-white/[0.06]">
              <Sparkles className="w-5 h-5 text-[#ff4d6a]" />
            </div>
            <div>
              <p className="text-white/30 text-[11px] font-semibold tracking-[0.1em] uppercase">
                {city.name}, {city.state}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="live-dot" style={{ width: 6, height: 6 }} />
                <span className="text-emerald-400 text-[11px] font-medium">Live</span>
              </div>
            </div>
          </div>
          <h2 className="font-syne font-extrabold text-[32px] text-white leading-[1.1] tracking-[-0.02em]">
            What would you like<br />to know today?
          </h2>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => { setMode('type'); if (isListening) stopListening(); }}
            className={cn(
              'px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all',
              mode === 'type'
                ? 'bg-white/10 text-white border border-white/[0.08]'
                : 'text-white/30 hover:text-white/50'
            )}
          >
            <Search className="w-3.5 h-3.5 inline mr-1.5" />Type
          </button>
          {isSupported && (
            <button
              onClick={() => { setMode('talk'); if (!isListening) startListening(); }}
              className={cn(
                'px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all',
                mode === 'talk'
                  ? 'bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/20'
                  : 'text-white/30 hover:text-white/50'
              )}
            >
              <Mic className="w-3.5 h-3.5 inline mr-1.5" />Talk
            </button>
          )}
        </div>

        {mode === 'type' ? (
          <div className="mb-5">
            <div className="flex items-center gap-2 p-[6px] pl-4 rounded-2xl bg-white/[0.04] border border-white/[0.06]
                            focus-within:border-[#ff4d6a]/30 focus-within:bg-white/[0.06] transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(input)}
                placeholder="Events, places, restaurants..."
                className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none tracking-[-0.01em]"
                autoFocus
              />
              <button
                onClick={() => handleSubmit(input)}
                disabled={!input.trim()}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#ff4d6a] to-[#a855f7] flex items-center justify-center
                           disabled:opacity-20 transition-all flex-shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-5 text-center py-4">
            <button
              onClick={handleMic}
              className={cn(
                'w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all',
                isListening
                  ? 'bg-[#ff4d6a] animate-pulse shadow-[0_0_40px_rgba(255,77,106,0.4)]'
                  : 'bg-gradient-to-br from-[#a855f7] to-[#ff4d6a] hover:scale-105 shadow-[0_0_30px_rgba(168,85,247,0.25)]'
              )}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
            <p className="text-white/35 text-[13px] mt-4 font-medium">
              {isListening ? 'Listening... tap to stop' : 'Tap to speak'}
            </p>
            {transcript && (
              <p className="text-[#ff4d6a] text-sm mt-2 animate-fadeUp font-medium">"{transcript}"</p>
            )}
          </div>
        )}

        {/* Category cards — inspired by travel dark UI */}
        <div className="flex-1 overflow-y-auto no-scrollbar -mx-1">
          <div className="grid grid-cols-2 gap-2.5 px-1">
            {QUICK_INTENTS.map((intent, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(intent.label)}
                className="group relative p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]
                           hover:border-white/[0.12] hover:bg-white/[0.06]
                           transition-all text-left animate-fadeUp overflow-hidden"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {/* Gradient accent bar */}
                <div className={cn(
                  'absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity',
                  intent.color
                )} />
                <span className="text-2xl block mb-2.5">{intent.icon}</span>
                <span className="text-[14px] font-semibold text-white/90 block leading-tight">{intent.label}</span>
                <span className="text-[11px] text-white/30 block mt-1">{intent.desc}</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/15 absolute bottom-4 right-4 group-hover:text-white/40 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onComplete()}
          className="mt-4 text-[13px] text-white/20 hover:text-white/40 transition-colors font-medium"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
