import { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, MicOff, Send, Sparkles, Search, BrainCircuit, Zap, Brain, SlidersHorizontal, ChevronDown, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '../../context';
import { generateAIResponse, SUGGESTION_CHIPS } from '../../services/ai-responses';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { AIVenueCard } from './AIVenueCard';
import { AskBar } from '../shared/AskBar';
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

const SLOT_LABELS = ['NOW', '+1h', '+2h', '+3h', '+4h'] as const;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Deterministic pseudo-random jitter from venue id + slot */
function jitter(seed: string, slot: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  h = ((h + slot * 7919) * 2654435761) >>> 0;
  return ((h % 41) - 20); // -20 to +20
}

type Verdict = 'GO NOW' | 'WATCH' | 'AVOID';

interface VerdictVenue {
  venue: Venue;
  forecastPct: number;
  verdict: Verdict;
  reason: string;
  spark: number[];
  factors: { label: string; delta: string; color: string }[];
}

function verdictFor(pct: number): Verdict {
  if (pct < 40) return 'GO NOW';
  if (pct < 70) return 'WATCH';
  return 'AVOID';
}

function reasonFor(verdict: Verdict): string {
  if (verdict === 'AVOID') return '2x normal for this hour. Peak crowd — try again after 11pm.';
  if (verdict === 'WATCH') return 'Building steadily. Still room now but will fill.';
  return 'Quiet window — 70% under normal. Act fast.';
}

function buildSpark(venue: Venue): number[] {
  const base = venue.pct;
  const pts: number[] = [];
  for (let i = 0; i < 20; i++) {
    const wobble = jitter(venue.id, i) * 0.6;
    const curve = Math.sin((i / 20) * Math.PI) * 12;
    pts.push(Math.max(5, Math.min(100, base + wobble + curve)));
  }
  return pts;
}

function buildOverlayBars(venues: Venue[]): { label: string; typical: number; live: number }[] {
  return SLOT_LABELS.map((label, i) => {
    const avgLive = venues.length > 0
      ? venues.reduce((sum, v) => sum + Math.min(100, Math.max(0, v.pct + jitter(v.id, i))), 0) / venues.length
      : 50;
    // Typical is a smoother baseline — lower wobble
    const avgTypical = venues.length > 0
      ? venues.reduce((sum, v) => sum + Math.min(100, Math.max(0, v.pct + jitter(v.id, i + 100) * 0.3)), 0) / venues.length
      : 50;
    return {
      label,
      live: Math.min(100, Math.max(15, avgLive)),
      typical: Math.min(100, Math.max(15, avgTypical * 0.85 + 8)),
    };
  });
}

function buildVerdictVenues(venues: Venue[]): VerdictVenue[] {
  const list: VerdictVenue[] = venues.map(v => {
    const forecastPct = Math.min(100, Math.max(5, v.pct + jitter(v.id, 1)));
    const verdict = verdictFor(forecastPct);
    return {
      venue: v,
      forecastPct,
      verdict,
      reason: reasonFor(verdict),
      spark: buildSpark(v),
      factors: [
        { label: 'Base: Friday night', delta: '+20%', color: 'var(--k-color-coral)' },
        { label: 'Weather clear', delta: '+5%', color: 'var(--k-color-green)' },
        { label: 'Event: concert nearby', delta: '+35%', color: 'var(--k-color-coral)' },
        { label: 'Your frequent time slot', delta: '+10%', color: 'var(--k-color-purple)' },
      ],
    };
  });
  // Sort: AVOID first, then WATCH, then GO NOW
  const order: Record<Verdict, number> = { 'AVOID': 0, 'WATCH': 1, 'GO NOW': 2 };
  list.sort((a, b) => order[a.verdict] - order[b.verdict] || b.forecastPct - a.forecastPct);
  return list.slice(0, 6);
}

// ── Sparkline SVG ────────────────────────────────────────────
function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 40;
  const h = 18;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Verdict Card ─────────────────────────────────────────────
function VerdictCard({ item, index }: { item: VerdictVenue; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const verdictBg =
    item.verdict === 'GO NOW' ? 'var(--k-color-green)' :
    item.verdict === 'WATCH' ? 'var(--k-color-amber)' :
    'var(--k-color-coral)';

  const sparkColor =
    item.verdict === 'GO NOW' ? 'var(--k-color-green)' :
    item.verdict === 'WATCH' ? 'var(--k-color-amber)' :
    'var(--k-color-coral)';

  return (
    <button
      onClick={() => setExpanded(e => !e)}
      className="w-full liquid-glass rounded-[20px] p-4 space-y-3 animate-fadeUp ios-press text-left"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="text-[13px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full text-white flex-shrink-0"
          style={{ background: verdictBg }}
        >
          {item.verdict}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-[var(--k-text)] truncate">{item.venue.name}</p>
          <p className="text-[11px] text-[var(--k-text-f)] truncate">{item.venue.type}</p>
        </div>
        <Sparkline points={item.spark} color={sparkColor} />
      </div>

      <p className="text-[12px] italic text-[var(--k-text-f)] leading-snug">{item.reason}</p>

      {expanded && (
        <div className="pt-2 border-t border-[var(--k-border-s)] space-y-2 animate-fadeUp">
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[var(--k-text-m)] uppercase">
            <Brain className="w-3 h-3" />
            Why this forecast?
          </div>
          {item.factors.map(f => (
            <div key={f.label} className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--k-text-m)]">{f.label}</span>
              <span className="font-mono font-bold" style={{ color: f.color }}>{f.delta}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

// ── Forecast Mode Component ─────────────────────────────────

function ForecastMode({ venues }: { venues: Venue[] }) {
  const overlayBars = useMemo(() => buildOverlayBars(venues), [venues]);
  const verdictVenues = useMemo(() => buildVerdictVenues(venues), [venues]);

  const dayName = DAY_NAMES[new Date().getDay()];

  // Anomaly detection: find venue with highest pct, flag if >80%
  const anomalyVenue = useMemo(() => {
    if (venues.length === 0) return null;
    const top = venues.reduce((a, b) => (a.pct > b.pct ? a : b));
    return top.pct > 80 ? top : null;
  }, [venues]);

  // Scenario planner state
  const [selectedScenario, setSelectedScenario] = useState('9:00 PM');
  const scenarios = [
    { time: '8:00 PM', crowd: 45, verdict: 'Moderate' },
    { time: '9:00 PM', crowd: 72, verdict: 'Busy' },
    { time: '10:00 PM', crowd: 88, verdict: 'Peak' },
  ];
  const scenarioRecommendation = useMemo(() => {
    const s = scenarios.find(s => s.time === selectedScenario);
    if (!s) return '';
    if (s.crowd < 50) return 'Best window — walk in without a wait.';
    if (s.crowd < 75) return 'Still manageable. Expect 5-10 min wait.';
    return 'Peak crowd window. Consider alternatives.';
  }, [selectedScenario]);

  return (
    <div className="flex-1 overflow-y-auto p-4 no-scrollbar scroll-smooth space-y-5">
      {/* ── Anomaly Spike Alert Banner ── */}
      {anomalyVenue && (
        <div className="mb-5 liquid-glass rounded-[18px] p-4 border border-[var(--k-color-coral)]/30 relative overflow-hidden"
             style={{ boxShadow: '0 0 40px -8px rgba(255, 77, 106, 0.4)' }}>
          {/* Pulsing bg */}
          <div className="absolute inset-0 bg-[var(--k-color-coral)]/5 animate-pulse pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--k-color-coral)]/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-[var(--k-color-coral)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--k-color-coral)]">ANOMALY DETECTED</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--k-color-coral)] animate-pulse" />
              </div>
              <p className="text-[14px] font-bold text-[var(--k-text)] leading-tight">
                Unusual crowd incoming at {anomalyVenue.name}
              </p>
              <p className="text-[11px] text-[var(--k-text-m)] mt-1 leading-snug">
                Predicted 2.3× typical for this hour. Likely cause: nearby event letting out.
              </p>
              <button className="mt-2 text-[11px] font-bold text-[var(--k-color-coral)] ios-press">
                View alternatives →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Overline + Headline ── */}
      <div className="pt-2 space-y-1">
        <p className="text-[10px] font-bold text-[var(--k-color-coral)] tracking-[0.1em] uppercase">
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

      {/* ── Ask the Forecast Bar ── */}
      <AskBar
        placeholder="Ask the forecast anything..."
        onSubmit={(prompt) => console.log('[KG Forecast]', prompt)}
        suggestions={[
          'Where should I go tonight under 20min wait?',
          'Quietest bar after 9pm',
          'Will it be busy at 11?',
        ]}
      />

      {/* ── Live vs Typical Overlay Card ── */}
      <div className="liquid-glass rounded-[20px] p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] font-bold text-[var(--k-text)]">Tonight vs Typical {dayName}</p>
            <p className="text-[11px] text-[var(--k-text-f)] mt-0.5">Live forecast overlaid on the baseline</p>
          </div>
        </div>

        {/* Overlay bar chart */}
        <div className="relative h-[160px] flex items-end justify-between gap-3 px-1 pt-6">
          {overlayBars.map((bar, i) => {
            const typicalH = Math.max(20, (bar.typical / 100) * 140);
            const liveH = Math.max(20, (bar.live / 100) * 140);
            return (
              <div key={bar.label} className="flex flex-col items-center flex-1 gap-1.5 relative">
                {/* NOW red pill label with arrow */}
                {i === 0 && (
                  <div className="absolute -top-6 flex flex-col items-center">
                    <span className="px-1.5 py-0.5 rounded-full bg-[var(--k-color-coral)] text-white text-[8px] font-black tracking-wider">
                      NOW
                    </span>
                    <ChevronDown className="w-3 h-3 text-[var(--k-color-coral)] -mt-0.5" />
                  </div>
                )}

                <div className="relative w-[44px]" style={{ height: '140px' }}>
                  {/* Typical (faded gray background) */}
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-[8px]"
                    style={{
                      height: `${typicalH}px`,
                      background: 'rgba(180, 180, 190, 0.4)',
                    }}
                  />
                  {/* Live/forecast (coral overlay) */}
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-[8px] transition-all duration-500"
                    style={{
                      height: `${liveH}px`,
                      background: 'linear-gradient(to top, var(--k-color-coral), #ff8a5c)',
                      boxShadow: '0 0 12px rgba(255, 77, 106, 0.3)',
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                </div>

                <span className="text-[9px] font-bold text-[var(--k-text-f)] tracking-wider">{bar.label}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-1">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--k-text-f)]">
            <span className="w-[8px] h-[8px] rounded-full" style={{ background: 'rgba(180, 180, 190, 0.6)' }} />
            Typical
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--k-text-f)]">
            <span className="w-[8px] h-[8px] rounded-full bg-[var(--k-color-coral)]" />
            Predicted
          </span>
        </div>
      </div>

      {/* ── Scenario Planner ── */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-3">
          <Clock className="w-3.5 h-3.5 text-[var(--k-text-m)]" />
          <span className="type-overline text-[var(--k-text-m)]">SCENARIO PLANNER</span>
        </div>
        <div className="liquid-glass rounded-[18px] p-4">
          <p className="text-[12px] text-[var(--k-text-m)] mb-3">
            If you leave at...
          </p>
          <div className="grid grid-cols-3 gap-2">
            {scenarios.map((s) => (
              <button
                key={s.time}
                onClick={() => setSelectedScenario(s.time)}
                className={`rounded-[14px] p-3 transition-all ios-press text-left
                  ${selectedScenario === s.time
                    ? 'bg-[var(--k-color-coral)]/15 border border-[var(--k-color-coral)]/40'
                    : 'glass-chip'}`}
              >
                <p className="text-[11px] font-bold text-[var(--k-text-m)] mb-1">{s.time}</p>
                <p className="text-[18px] font-syne font-black text-[var(--k-text)] leading-none">{s.crowd}%</p>
                <p className="text-[9px] text-[var(--k-text-f)] mt-1 font-semibold uppercase tracking-wider">
                  {s.verdict}
                </p>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[var(--k-text-m)] mt-3 leading-snug italic">
            {scenarioRecommendation}
          </p>
        </div>
      </div>

      {/* ── Verdict Cards ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="type-overline text-[var(--k-text-f)]">TONIGHT'S VERDICTS</span>
          <SlidersHorizontal className="w-4 h-4 text-[var(--k-text-f)]" />
        </div>
        <div className="space-y-2">
          {verdictVenues.map((item, i) => (
            <VerdictCard key={item.venue.id} item={item} index={i} />
          ))}
        </div>
      </div>

      {/* ── Predictive Accuracy footer badge ── */}
      <div className="liquid-glass rounded-full py-2 px-4 flex items-center gap-2 justify-center w-fit mx-auto">
        <Brain className="w-3.5 h-3.5 text-[var(--k-color-purple)]" />
        <span className="text-[11px] font-semibold text-[var(--k-text-m)]">Predictive Accuracy</span>
        <span className="text-[12px] font-black text-[var(--k-color-green)] font-mono">94.8%</span>
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
              <BrainCircuit className="w-5 h-5 text-[var(--k-color-coral)]" />
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
                  ? 'glass-chip text-[var(--k-color-coral)]'
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
                      ? 'bg-[#a855f7]/15 text-[var(--k-color-purple)]'
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
                                 hover:bg-[#ff4d6a]/8 hover:border-[#ff4d6a]/20 hover:text-[var(--k-color-coral)] transition-colors
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
                                       hover:bg-[#a855f7]/10 hover:border-[#a855f7]/20 hover:text-[var(--k-color-purple)] transition-colors
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
                  className="w-14 h-14 mx-auto rounded-full bg-[var(--k-color-coral)] animate-pulse flex items-center justify-center
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
                  <Send className={`w-4 h-4 ${input.trim() ? 'text-white' : 'text-[var(--k-color-coral)]'}`} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
