import { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, MicOff, Send, Sparkles, Search, BrainCircuit, Clock, Zap, Brain, SlidersHorizontal, ChevronRight, MapPin } from 'lucide-react';
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

// ── Forecast helpers ────────────────────────────────────────

type TimeRange = 'NOW' | '1H' | '3H' | '8H';

const TIME_SLOTS = ['18:00', '19:00', '20:00', '21:00', '22:00'] as const;

/** Deterministic pseudo-random jitter from venue id + slot */
function jitter(seed: string, slot: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  h = ((h + slot * 7919) * 2654435761) >>> 0;
  return ((h % 41) - 20); // -20 to +20
}

function densityColor(pct: number): string {
  if (pct < 30) return '#34d399';   // green
  if (pct < 50) return '#a3b18a';   // olive
  if (pct < 70) return '#fbbf24';   // amber
  if (pct < 85) return '#ff4d6a';   // red
  return '#92400e';                  // brown
}

interface ForecastVenue {
  venue: Venue;
  forecastPct: number;
  change: number;
  peakTime: string;
  footTraffic: number;
}

function buildForecastData(venues: Venue[], range: TimeRange): {
  bars: { label: string; pct: number; color: string }[];
  hotspots: ForecastVenue[];
  criticalVenue: ForecastVenue | null;
} {
  const multiplier = range === 'NOW' ? 0 : range === '1H' ? 1 : range === '3H' ? 2 : 3;

  // Build density bars from aggregate venue data per time slot
  const bars = TIME_SLOTS.map((label, i) => {
    const avgPct = venues.length > 0
      ? venues.reduce((sum, v) => sum + Math.min(100, Math.max(0, v.pct + jitter(v.id, i + multiplier))), 0) / venues.length
      : 50;
    const clamped = Math.min(100, Math.max(15, avgPct));
    return { label, pct: clamped, color: densityColor(clamped) };
  });

  // Build hotspot list
  const peakTimes = ['2:30 PM', '3:15 PM', '4:00 PM', '5:45 PM', '6:30 PM', '7:00 PM', '8:15 PM'];
  const hotspots: ForecastVenue[] = venues.map((v, i) => {
    const forecastPct = Math.min(100, Math.max(5, v.pct + jitter(v.id, multiplier)));
    const change = forecastPct - v.pct;
    return {
      venue: v,
      forecastPct,
      change,
      peakTime: peakTimes[i % peakTimes.length],
      footTraffic: Math.round(12 + Math.abs(jitter(v.id, multiplier + 3)) * 1.5),
    };
  });

  hotspots.sort((a, b) => b.forecastPct - a.forecastPct);

  const criticalVenue = hotspots.find(h => h.forecastPct >= 80) ?? null;

  return { bars, hotspots: hotspots.slice(0, 6), criticalVenue };
}

// ── Forecast Mode Component ─────────────────────────────────

function ForecastMode({ venues }: { venues: Venue[] }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('NOW');

  const { bars, hotspots, criticalVenue } = useMemo(
    () => buildForecastData(venues, timeRange),
    [venues, timeRange]
  );

  const ranges: TimeRange[] = ['NOW', '1H', '3H', '8H'];

  // Find the "live" bar index (first bar)
  const liveBarIdx = 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 no-scrollbar scroll-smooth space-y-5">
      {/* ── Overline + Headline ── */}
      <div className="pt-2 space-y-1">
        <p className="text-[10px] font-bold text-[#ff4d6a] tracking-[0.1em] uppercase">
          PREDICTIVE INTELLIGENCE
        </p>
        <h1 className="font-syne text-[28px] font-extrabold leading-tight text-[var(--k-text)]">
          Anticipate
        </h1>
        <h1
          className="font-syne font-black text-[32px] leading-tight bg-gradient-to-r from-[#ff4d6a] to-[#ff8a5c] bg-clip-text"
          style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          The Pulse.
        </h1>
      </div>

      {/* ── Density Trends Card ── */}
      <div className="liquid-glass rounded-[20px] p-5 space-y-4">
        {/* Card header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] font-bold text-[var(--k-text)]">Density Trends</p>
            <p className="text-[11px] text-[var(--k-text-f)] mt-0.5">Live vs. Predicted saturation levels</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--k-text-f)]">
              <span className="w-[6px] h-[6px] rounded-full bg-[#34d399]" />
              LIVE
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--k-text-f)]">
              <span className="w-[6px] h-[6px] rounded-full bg-[#ff4d6a]" />
              FORECAST
            </span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="relative h-[150px] flex items-end justify-between gap-3 px-1">
          {bars.map((bar, i) => (
            <div key={bar.label} className="flex flex-col items-center flex-1 gap-1.5 relative">
              {/* LIVE floating label on first bar */}
              {i === liveBarIdx && (
                <span className="absolute -top-5 text-[8px] font-bold text-[#34d399] tracking-wider">LIVE</span>
              )}
              <div
                className="w-[48px] rounded-t-[8px] transition-all duration-500"
                style={{
                  height: `${Math.max(20, (bar.pct / 100) * 140)}px`,
                  background: `linear-gradient(to top, ${bar.color}cc, ${bar.color}88)`,
                  boxShadow: `0 0 12px ${bar.color}33`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Labels below bars */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[9px] font-bold text-[var(--k-text-f)] tracking-wider">CURRENT</span>
          <span className="text-[9px] font-bold text-[var(--k-text-f)] tracking-wider">PROJECTION WINDOW</span>
        </div>

        {/* Time range pills */}
        <div className="flex items-center gap-2">
          {ranges.map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all ios-press',
                timeRange === r
                  ? 'bg-[var(--k-text)] text-[var(--k-bg)]'
                  : 'glass-chip text-[var(--k-text-f)] hover:text-[var(--k-text-m)]'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Critical Capacity Alert ── */}
      {criticalVenue && (
        <div className="space-y-3">
          <div
            className="rounded-[20px] p-5 space-y-4 animate-fadeUp text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,77,106,0.18), rgba(255,138,92,0.10))',
              border: '1px solid rgba(255, 77, 106, 0.25)',
            }}
          >
            {/* Zap icon in coral circle */}
            <div className="w-12 h-12 rounded-full bg-[#ff4d6a]/20 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 text-[#ff4d6a]" />
            </div>

            <p className="text-[18px] font-bold text-white">
              Critical Capacity Alert
            </p>
            <p className="text-[13px] text-white/80 leading-relaxed">
              {criticalVenue.venue.name} is predicted to reach{' '}
              <span className="font-bold text-white">{criticalVenue.forecastPct}% capacity</span>{' '}
              by {criticalVenue.peakTime}.
            </p>

            <button className="px-5 py-2.5 rounded-full text-[11px] font-bold tracking-wider text-white border border-white/30 hover:bg-white/10 transition-colors ios-press">
              VIEW ALTERNATIVE ROUTES
            </button>
          </div>

          {/* Predictive Accuracy sub-card */}
          <div className="liquid-glass rounded-[20px] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#a855f7]/15 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-[#a855f7]" />
            </div>
            <span className="text-[13px] font-semibold text-[var(--k-text)]">Predictive Accuracy</span>
            <span className="ml-auto text-[20px] font-black text-[#34d399] font-mono">94.8%</span>
          </div>
        </div>
      )}

      {/* ── Surge Hotspots ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="type-overline text-[var(--k-text-f)]">SURGE HOTSPOTS</span>
          <SlidersHorizontal className="w-4 h-4 text-[var(--k-text-f)]" />
        </div>
        <div className="space-y-2">
          {hotspots.map((h, i) => {
            const surgePct = Math.max(0, h.forecastPct - h.venue.pct);
            return (
              <div
                key={h.venue.id}
                className="liquid-glass rounded-[20px] p-4 space-y-3 animate-fadeUp ios-press"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {/* Top row: MapPin icon + venue name + surge badge */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#ff4d6a]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#ff4d6a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[var(--k-text)] truncate">{h.venue.name}</p>
                  </div>
                  <div className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#ff4d6a]/12 text-[#ff4d6a] tracking-wide">
                    +{surgePct > 0 ? surgePct : Math.abs(h.change)}% SURGE
                  </div>
                </div>

                {/* Location line */}
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--k-text-f)]">
                  <MapPin className="w-3 h-3" />
                  <span>{h.venue.type}</span>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between text-[10px] font-bold font-mono text-[var(--k-text-m)] tracking-wide">
                  <span>CURRENT: {h.venue.pct}%</span>
                  <span>PEAK: {h.forecastPct}%</span>
                </div>

                {/* Progress bar — coral gradient */}
                <div className="h-[5px] rounded-full bg-[var(--k-border-s)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, h.forecastPct)}%`,
                      background: 'linear-gradient(90deg, #ff4d6a, #ff8a5c)',
                    }}
                  />
                </div>

                {/* Peak time footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--k-text-m)]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Peak at {h.peakTime}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--k-text-f)]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom padding for floating nav */}
      <div className="h-20" />
    </div>
  );
}

// ── Main PredictView ────────────────────────────────────────

export function PredictView() {
  const { selectedCity, venues } = useAppContext();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [inputMode, setInputMode] = useState<'type' | 'talk'>('type');
  const [viewMode, setViewMode] = useState<'chat' | 'forecast'>('chat');
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
      setInputMode('talk');
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--k-bg)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--k-border-s)] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center"
                 style={{ boxShadow: 'var(--k-glow-coral)' }}>
              <BrainCircuit className="w-5 h-5 text-[#ff4d6a]" />
            </div>
            <div>
              <h2 className="font-syne font-extrabold text-[17px] gradient-text tracking-[-0.02em]">KROWD AI</h2>
              <p className="text-[10px] text-[var(--k-text-m)]">{selectedCity.name} · Crowd intelligence</p>
            </div>
          </div>

          {/* Top-level mode toggle: Chat | Forecast */}
          <div className="flex items-center gap-1 p-0.5 rounded-full"
               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--k-border-s)' }}>
            <button
              onClick={() => setViewMode('chat')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all ios-press',
                viewMode === 'chat'
                  ? 'glass-chip text-[var(--k-text)]'
                  : 'text-[var(--k-text-f)]'
              )}
            >
              Chat
            </button>
            <button
              onClick={() => setViewMode('forecast')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all ios-press',
                viewMode === 'forecast'
                  ? 'glass-chip text-[#ff4d6a]'
                  : 'text-[var(--k-text-f)]'
              )}
            >
              <Zap className="w-3 h-3 inline mr-1" />Forecast
            </button>
          </div>
        </div>
      </div>

      {/* ── Forecast Mode ── */}
      {viewMode === 'forecast' && <ForecastMode venues={venues} />}

      {/* ── Chat Mode ── */}
      {viewMode === 'chat' && (
        <>
          {/* Chat sub-header: Type / Talk toggle */}
          <div className="px-4 pt-2 pb-1 flex justify-end flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setInputMode('type'); if (isListening) stopListening(); }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-[11px] font-bold transition-all',
                  inputMode === 'type'
                    ? 'glass-chip text-[var(--k-text)]'
                    : 'text-[var(--k-text-f)]'
                )}
              >
                <Search className="w-3 h-3 inline mr-1" />Type
              </button>
              {isSupported && (
                <button
                  onClick={() => { setInputMode('talk'); if (!isListening) startListening(); }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-[11px] font-bold transition-all',
                    inputMode === 'talk' || isListening
                      ? 'bg-[#a855f7]/15 text-[#a855f7]'
                      : 'text-[var(--k-text-f)]'
                  )}
                >
                  <Mic className="w-3 h-3 inline mr-1" />Talk
                </button>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 no-scrollbar scroll-smooth">
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
                          'p-3.5 rounded-2xl text-[13px]',
                          msg.type === 'user'
                            ? 'max-w-[75%] border border-[#ff4d6a]/15 text-[var(--k-text)] rounded-br-md'
                            : 'max-w-[80%] glass-chip text-[var(--k-text)] rounded-bl-md'
                        )}
                        style={msg.type === 'user' ? { background: 'linear-gradient(135deg, rgba(255,77,106,0.12), rgba(168,85,247,0.08))' } : undefined}
                      >
                        <p>{msg.text}</p>

                        {/* Venue cards */}
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
                            className="px-3 py-1.5 text-[11px] rounded-full glass-chip
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
          </div>

          {/* Input Area */}
          <div className="px-4 pt-3 pb-24 border-t border-[var(--k-border-s)] bg-[var(--k-bg)] flex-shrink-0">
            {inputMode === 'talk' && isListening ? (
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
        </>
      )}
    </div>
  );
}
