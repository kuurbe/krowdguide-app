import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronRight, Sparkles, Clock, MapPin, Flame, Zap } from 'lucide-react';
import type { Venue } from '../../types';

/**
 * FocusCard — rotating AI concierge recommendation.
 *
 * Shows ONE thing the app thinks you should do right now.
 * Auto-rotates every 8 seconds, or swipe/tap to see the next one.
 * Tap the card to act on the recommendation.
 */

type RecType = 'quiet-window' | 'peak-alert' | 'happy-hour' | 'sunset' | 'event-nearby' | 'hidden-gem';

interface Recommendation {
  id: string;
  type: RecType;
  title: string;
  subtitle: string;
  action: string;
  venue: Venue;
  accent: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

interface Props {
  venues: Venue[];
  onAct: (venue: Venue) => void;
}

function buildRecommendations(venues: Venue[]): Recommendation[] {
  if (venues.length === 0) return [];

  const recs: Recommendation[] = [];

  // 1. Quiet window — find the quietest venue
  const quietest = venues.slice().sort((a, b) => a.pct - b.pct)[0];
  if (quietest) {
    recs.push({
      id: `quiet-${quietest.id}`,
      type: 'quiet-window',
      title: `Go to ${quietest.name}`,
      subtitle: `Quietest window right now — ${quietest.pct}% crowd`,
      action: 'Walk here',
      venue: quietest,
      accent: '#34d399',
      icon: Sparkles,
    });
  }

  // 2. Happy hour active
  const hh = venues.find(v => v.hasHH);
  if (hh) {
    recs.push({
      id: `hh-${hh.id}`,
      type: 'happy-hour',
      title: `${hh.name} — HH active`,
      subtitle: hh.hhDeal || 'Happy hour running now',
      action: 'Get directions',
      venue: hh,
      accent: '#ff8c42',
      icon: Clock,
    });
  }

  // 3. Peak alert — busiest venue
  const busiest = venues.slice().sort((a, b) => b.pct - a.pct)[0];
  if (busiest && busiest.pct > 70) {
    recs.push({
      id: `peak-${busiest.id}`,
      type: 'peak-alert',
      title: `${busiest.name} is peaking`,
      subtitle: `${busiest.pct}% capacity — arrive by 8pm or wait`,
      action: 'See alternatives',
      venue: busiest,
      accent: '#ff4d6a',
      icon: Flame,
    });
  }

  // 4. Hidden gem — moderate crowd, high rating
  const gem = venues.find(v => v.crowd === 'moderate' && (v.rating ?? 0) > 4.3);
  if (gem) {
    recs.push({
      id: `gem-${gem.id}`,
      type: 'hidden-gem',
      title: `Hidden gem: ${gem.name}`,
      subtitle: `${gem.rating}★ rating, not overrun yet`,
      action: 'View details',
      venue: gem,
      accent: '#a855f7',
      icon: Zap,
    });
  }

  // 5. Sunset spot — time-based
  const hour = new Date().getHours();
  if (hour >= 17 && hour < 20) {
    const rooftop = venues.find(v => /rooftop|view|sky/i.test(v.type)) ?? venues[1];
    if (rooftop) {
      recs.push({
        id: `sunset-${rooftop.id}`,
        type: 'sunset',
        title: `Golden hour at ${rooftop.name}`,
        subtitle: 'Sunset in 18 min — best views in the city',
        action: 'Take me there',
        venue: rooftop,
        accent: '#ff8c42',
        icon: MapPin,
      });
    }
  }

  // 6. Event nearby — fallback to a random moderate venue
  if (recs.length < 4 && venues.length > 2) {
    const v = venues[2];
    recs.push({
      id: `nearby-${v.id}`,
      type: 'event-nearby',
      title: `Trending: ${v.name}`,
      subtitle: `Buzzing with ${v.pct}% crowd — momentum rising`,
      action: 'Check it out',
      venue: v,
      accent: '#22d3ee',
      icon: Flame,
    });
  }

  return recs;
}

export function FocusCard({ venues, onAct }: Props) {
  const recommendations = useMemo(() => buildRecommendations(venues), [venues]);
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  // Auto-rotate every 8s
  useEffect(() => {
    if (recommendations.length <= 1) return;
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex(i => (i + 1) % recommendations.length);
        setFading(false);
      }, 250);
    }, 8000);
    return () => clearInterval(t);
  }, [recommendations.length]);

  const next = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setIndex(i => (i + 1) % recommendations.length);
      setFading(false);
    }, 200);
  }, [recommendations.length]);

  if (recommendations.length === 0) return null;

  const rec = recommendations[index];
  const Icon = rec.icon;

  return (
    <div
      className="relative overflow-hidden rounded-[18px] liquid-glass"
      style={{
        boxShadow: `0 0 28px -8px ${rec.accent}55, inset 0 1px 0 rgba(255,255,255,0.08)`,
        border: `1px solid ${rec.accent}35`,
      }}
    >
      {/* Accent gradient wash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top right, ${rec.accent}22, transparent 65%)`,
        }}
      />

      {/* Live indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: rec.accent }} />
        <span className="text-[9px] font-black uppercase tracking-[0.1em]" style={{ color: rec.accent }}>
          Live
        </span>
      </div>

      {/* Card content — fades between rotations */}
      <button
        onClick={() => onAct(rec.venue)}
        className={`relative w-full p-4 pr-3 text-left transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="flex items-start gap-3">
          {/* Icon badge */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${rec.accent}18`,
              border: `1px solid ${rec.accent}35`,
              boxShadow: `0 0 16px ${rec.accent}30`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: rec.accent }} />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="type-overline text-[var(--k-text-m)] text-[9px] mb-0.5">
              FOR YOU · NOW
            </p>
            <h3 className="font-syne text-[17px] font-black text-[var(--k-text)] leading-[1.15] tracking-[-0.01em] truncate">
              {rec.title}
            </h3>
            <p className="text-[12px] text-[var(--k-text-m)] mt-0.5 leading-snug truncate">
              {rec.subtitle}
            </p>

            {/* Action row */}
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className="text-[11px] font-bold uppercase tracking-[0.04em]"
                style={{ color: rec.accent }}
              >
                {rec.action}
              </span>
              <ChevronRight className="w-3.5 h-3.5" style={{ color: rec.accent }} />
            </div>
          </div>
        </div>
      </button>

      {/* Pagination dots + skip */}
      {recommendations.length > 1 && (
        <div className="relative flex items-center justify-between px-4 pb-3">
          <div className="flex gap-1">
            {recommendations.map((_, i) => (
              <span
                key={i}
                className="h-[3px] rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 14 : 4,
                  background: i === index ? rec.accent : 'var(--k-text-f)',
                  opacity: i === index ? 1 : 0.3,
                }}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="text-[10px] font-bold text-[var(--k-text-m)] uppercase tracking-wider ios-press"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
