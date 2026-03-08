import { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, MicOff, Send, Sparkles, Search, BrainCircuit } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAppContext } from '../../context';
import { getVenuesForCity } from '../../data/venues';
import { generateAIResponse, SUGGESTION_CHIPS } from '../../services/ai-responses';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { CrowdPill } from '../shared/CrowdPill';
import type { ChatMessage, Venue } from '../../types';

export function PredictView() {
  const { selectedCity } = useAppContext();
  const venues = useMemo(() => getVenuesForCity(selectedCity.id), [selectedCity.id]);

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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff4d6a]/15 to-[#a855f7]/15
                          flex items-center justify-center animate-float border border-white/[0.06]">
            <BrainCircuit className="w-6 h-6 text-[#ff4d6a]" />
          </div>
          <div>
            <h2 className="font-syne font-extrabold text-[18px] gradient-text">KROWD AI</h2>
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
                  className="px-3.5 py-2 text-[12px] rounded-full bg-white/[0.03] border border-white/[0.06]
                             hover:bg-[#ff4d6a]/8 hover:border-[#ff4d6a]/20 hover:text-[#ff4d6a] transition-colors
                             text-[var(--k-text-2)] font-medium"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
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
                      ? 'bg-[#ff4d6a]/15 border border-[#ff4d6a]/20 text-[var(--k-text)] rounded-br-md'
                      : 'bg-[var(--k-surface)] border border-[var(--k-border)] text-[var(--k-text)] rounded-bl-md'
                  )}
                >
                  <p>{msg.text}</p>

                  {msg.data?.type === 'restaurants' && msg.data.venues && (
                    <div className="mt-3 space-y-2">
                      {msg.data.venues.map((v: Venue) => (
                        <div key={v.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--k-surface)]">
                          <span className="text-[12px] font-medium">{v.icon} {v.name}</span>
                          <CrowdPill crowd={v.crowd} pct={v.pct} />
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.data?.type === 'crowd' && msg.data.venues && (
                    <div className="mt-3 space-y-2">
                      {msg.data.venues.map((v: Venue) => (
                        <div key={v.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--k-surface)]">
                          <span className="text-[12px] font-medium">{v.icon} {v.name}</span>
                          <CrowdPill crowd={v.crowd} pct={v.pct} />
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.data?.type === 'timing' && (
                    <div className="mt-3">
                      <div className="flex items-end gap-1 h-16">
                        {msg.data.chart.map((h: number, i: number) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-gradient-to-t from-[#ff4d6a]/40 to-[#a855f7]/80"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-[var(--k-text-f)] mt-1 text-center">12PM - 11PM crowd levels</p>
                    </div>
                  )}

                  {msg.data?.type === 'hh' && msg.data.venues && (
                    <div className="mt-3 space-y-2">
                      {msg.data.venues.map((v: Venue) => (
                        <div key={v.id} className="p-2.5 rounded-xl bg-[var(--k-surface)]">
                          <span className="text-[12px] font-medium">{v.icon} {v.name}</span>
                          <p className="text-[12px] text-[#ff8c42] mt-0.5 font-semibold">{v.hhDeal}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.data?.type === 'quiet' && msg.data.venues && (
                    <div className="mt-3 space-y-2">
                      {msg.data.venues.map((v: Venue) => (
                        <div key={v.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--k-surface)]">
                          <span className="text-[12px] font-medium">{v.icon} {v.name}</span>
                          <CrowdPill crowd={v.crowd} pct={v.pct} />
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-[var(--k-text-f)] mt-2">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff4d6a] to-[#a855f7]
                                flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--k-surface)] border border-[var(--k-border)] rounded-bl-md">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ff4d6a]/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#a855f7]/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#22d3ee]/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
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
          <div className="flex items-center gap-2 p-[5px] pl-4 rounded-2xl bg-white/[0.04] border border-white/[0.06]
                          focus-within:border-[#ff4d6a]/25 transition-all">
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
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#ff4d6a]
                           flex items-center justify-center hover:scale-105 transition-all flex-shrink-0"
              >
                <Mic className="w-5 h-5 text-white" />
              </button>
            )}
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-[#ff4d6a]/15 flex items-center justify-center
                         disabled:opacity-20 hover:bg-[#ff4d6a]/25 transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4 text-[#ff4d6a]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
