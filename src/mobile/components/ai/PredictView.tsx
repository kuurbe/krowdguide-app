import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, Search, BrainCircuit } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAppContext } from '../../context';
import { generateAIResponse, SUGGESTION_CHIPS } from '../../services/ai-responses';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { AIVenueCard } from './AIVenueCard';
import type { ChatMessage, Venue } from '../../types';

/** Follow-up chips per response type */
const FOLLOW_UP_CHIPS: Record<string, string[]> = {
  crowd: ['Show me quiet spots', 'Best time to go?'],
  restaurants: ['Any happy hours?', 'Which is least crowded?'],
  hh: ['Show all food spots', "What's busy right now?"],
  quiet: ["Where's the action?", 'Happy hour deals?'],
  timing: ['Find quiet spots nearby', 'Best happy hour deals?'],
  recommendation: ['Compare two spots', 'Any happy hours?'],
};

export function PredictView() {
  const { selectedCity, venues } = useAppContext();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<'type' | 'talk'>('type');
  const chatRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (transcript && !isListening) {
      handleSend(transcript);
    }
  }, [transcript, isListening]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = generateAIResponse(text, venues, selectedCity.name);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1200);
  };

  const handleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      setMode('talk');
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--k-bg)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--k-border-s)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl liquid-glass
                          flex items-center justify-center animate-float"
               style={{ boxShadow: 'var(--k-glow-coral)' }}>
            <BrainCircuit className="w-6 h-6 text-[#ff4d6a]" />
          </div>
          <div>
            <h2 className="font-syne font-extrabold text-[20px] gradient-text tracking-[-0.02em]">KROWD AI</h2>
            <p className="text-[11px] text-[var(--k-text-m)]">{selectedCity.name} · Historical data & crowd reports</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => { setMode('type'); if (isListening) stopListening(); }}
            className={cn(
              'px-4 py-2 rounded-full text-[12px] font-bold transition-all',
              mode === 'type'
                ? 'bg-white/8 text-[var(--k-text)] border border-white/[0.08]'
                : 'text-[var(--k-text-f)] hover:text-[var(--k-text-m)]'
            )}
          >
            <Search className="w-3 h-3 inline mr-1" />Type
          </button>
          {isSupported && (
            <button
              onClick={() => { setMode('talk'); if (!isListening) startListening(); }}
              className={cn(
                'px-4 py-2 rounded-full text-[12px] font-bold transition-all',
                mode === 'talk' || isListening
                  ? 'bg-[#a855f7]/15 text-[#a855f7] border border-[#a855f7]/20'
                  : 'text-[var(--k-text-f)] hover:text-[var(--k-text-m)]'
              )}
            >
              <Mic className="w-3 h-3 inline mr-1" />Talk
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea ref={chatRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="space-y-5 pt-4">
            <div className="text-center">
              <p className="text-[14px] text-[var(--k-text-2)] font-medium">
                Ask about crowds, venues, or what's happening
              </p>
              <p className="text-[12px] text-[var(--k-text-f)] mt-1">
                Powered by historical data & crowd reports
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTION_CHIPS.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(chip)}
                  className="px-3.5 py-2 text-[12px] rounded-full glass-chip
                             hover:bg-[#ff4d6a]/8 hover:border-[#ff4d6a]/20 hover:text-[#ff4d6a] transition-colors
                             text-[var(--k-text-2)] font-medium animate-fadeUp"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div
                  className={cn(
                    'flex gap-3 animate-fadeUp',
                    msg.type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.type === 'ai' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff4d6a] to-[#a855f7]
                                    flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] p-3.5 rounded-2xl text-[13px]',
                      msg.type === 'user'
                        ? 'border border-[#ff4d6a]/15 text-[var(--k-text)] rounded-br-md'
                        : 'glass-chip text-[var(--k-text)] rounded-bl-md'
                    )}
                    style={msg.type === 'user' ? { background: 'linear-gradient(135deg, rgba(255,77,106,0.12), rgba(168,85,247,0.08))' } : undefined}
                  >
                    <p>{msg.text}</p>

                    {/* Venue cards — unified renderer for all response types */}
                    {msg.data?.venues && msg.data.venues.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {(msg.data.venues as Venue[]).map((v, i) => (
                          <AIVenueCard
                            key={v.id}
                            venue={v}
                            index={i}
                            showHHDeal={msg.data?.type === 'hh'}
                          />
                        ))}
                      </div>
                    )}

                    {/* Timing chart */}
                    {msg.data?.type === 'timing' && msg.data.chart && (
                      <div className="mt-3 glass-chip rounded-xl p-3">
                        <div className="flex items-end gap-1 h-16">
                          {(msg.data.chart as number[]).map((h: number, i: number) => (
                            <div
                              key={i}
                              className="flex-1 rounded-t bg-gradient-to-t from-[#ff4d6a]/40 to-[#a855f7]/80"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between mt-1.5 text-[9px] text-[var(--k-text-f)] font-medium">
                          <span>12p</span><span>3p</span><span>6p</span><span>9p</span><span>11p</span>
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-[var(--k-text-f)] mt-2">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Follow-up suggestion chips */}
                {msg.type === 'ai' && msg.data?.type && FOLLOW_UP_CHIPS[msg.data.type] && (
                  <div className="flex gap-1.5 mt-2 ml-11 flex-wrap">
                    {FOLLOW_UP_CHIPS[msg.data.type].map((chip, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(chip)}
                        className="px-3 py-1.5 text-[11px] rounded-full bg-white/[0.03] border border-white/[0.06]
                                   hover:bg-[#a855f7]/10 hover:border-[#a855f7]/20 hover:text-[#a855f7] transition-colors
                                   text-[var(--k-text-m)] font-medium"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff4d6a] to-[#a855f7]
                                flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="p-3.5 rounded-2xl glass-chip rounded-bl-md flex items-center">
                  <div className="w-16 h-[6px] rounded-full skeleton-shimmer"
                       style={{ background: 'linear-gradient(90deg, rgba(255,77,106,0.3), rgba(168,85,247,0.3), rgba(34,211,238,0.3), rgba(255,77,106,0.3))', backgroundSize: '300% 100%' }} />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="px-4 pt-3 pb-20 border-t border-[var(--k-border-s)] bg-gradient-to-t from-[var(--k-bg)] to-transparent flex-shrink-0">
        {mode === 'talk' && isListening ? (
          <div className="text-center py-2">
            <button
              onClick={handleMic}
              className="w-14 h-14 mx-auto rounded-full bg-[#ff4d6a] animate-pulse flex items-center justify-center
                         shadow-[0_0_30px_rgba(255,77,106,0.4)]"
            >
              <MicOff className="w-6 h-6 text-white" />
            </button>
            <p className="text-[12px] text-[var(--k-text-m)] mt-2 font-medium">Listening... tap to stop</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-[5px] pl-4 rounded-2xl glass-chip
                          focus-within:border-[#ff4d6a]/25 transition-all"
               style={{ transition: 'box-shadow 0.3s ease' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask the city anything..."
              className="flex-1 bg-transparent text-[14px] text-[var(--k-text)] placeholder:text-[var(--k-text-f)] outline-none"
            />
            {isSupported && (
              <button
                onClick={handleMic}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#a855f7] to-[#ff4d6a]
                           flex items-center justify-center hover:scale-105 transition-all flex-shrink-0"
              >
                <Mic className="w-5 h-5 text-white" />
              </button>
            )}
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-2xl flex items-center justify-center
                         disabled:opacity-20 transition-all flex-shrink-0"
              style={input.trim() ? {
                background: 'linear-gradient(135deg, #ff4d6a, #a855f7)',
                boxShadow: 'var(--k-glow-coral)',
              } : {
                background: 'rgba(255, 77, 106, 0.15)',
              }}
            >
              <Send className={`w-4 h-4 ${input.trim() ? 'text-white' : 'text-[#ff4d6a]'}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
