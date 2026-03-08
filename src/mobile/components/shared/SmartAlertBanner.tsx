import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ShieldCheck, Zap, Wine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Venue } from '../../types';

/** Audience-specific proactive alerts derived from venue data */
interface SmartAlert {
  id: string;
  audience: 'inclusion' | 'hype' | 'sophisticated';
  icon: React.ReactNode;
  title: string;
  body: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

function deriveAlerts(venues: Venue[], isLive: boolean): SmartAlert[] {
  const alerts: SmartAlert[] = [];

  // ── Inclusion Group: "Sensory Change" when a quiet zone suddenly gets busy
  const risingQuiet = venues.find(v => v.crowd === 'moderate' && v.pct >= 50 && v.type.toLowerCase().includes('park'));
  if (risingQuiet) {
    const quiet = venues.find(v => v.crowd === 'quiet' && v.pct < 30);
    alerts.push({
      id: 'inclusion-' + risingQuiet.id,
      audience: 'inclusion',
      icon: <ShieldCheck className="w-4 h-4" />,
      title: 'Sensory Change Detected',
      body: `Pressure rising at ${risingQuiet.name}${quiet ? `. Try ${quiet.name} (${quiet.pct}%)` : ''}`,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/[0.08]',
      borderColor: 'border-emerald-500/20',
    });
  }

  // ── Hype Group: "Energy Spike" — venue with happy hour + low occupancy
  const hhVenue = venues.find(v => v.hasHH && v.pct < 50);
  if (hhVenue) {
    alerts.push({
      id: 'hype-' + hhVenue.id,
      audience: 'hype',
      icon: <Zap className="w-4 h-4" />,
      title: 'Energy Building',
      body: `${hhVenue.name} only ${hhVenue.pct}% full. ${hhVenue.hhDeal}`,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/[0.08]',
      borderColor: 'border-amber-500/20',
    });
  }

  // ── Sophisticated Group: "Window Closing" — upscale venue getting busy
  const upscale = venues.find(v =>
    v.crowd === 'busy' && v.pct >= 70 &&
    (v.type.toLowerCase().includes('restaurant') || v.type.toLowerCase().includes('japanese'))
  );
  if (upscale) {
    alerts.push({
      id: 'sophisticated-' + upscale.id,
      audience: 'sophisticated',
      icon: <Wine className="w-4 h-4" />,
      title: 'Elegant Window Closing',
      body: `${upscale.name} at ${upscale.pct}%. High inbound traffic.`,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/[0.08]',
      borderColor: 'border-violet-500/20',
    });
  }

  // ── Oracle live alert
  if (isLive) {
    const oracle = venues.find(v => v.id.startsWith('oracle-'));
    if (oracle) {
      alerts.push({
        id: 'oracle-live',
        audience: 'inclusion',
        icon: <ShieldCheck className="w-4 h-4" />,
        title: 'Oracle Verified',
        body: `${oracle.name}: ${oracle.pct}% occupancy confirmed.`,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/[0.08]',
        borderColor: 'border-emerald-500/20',
      });
    }
  }

  return alerts;
}

export function SmartAlertBanner({ venues, isLive }: { venues: Venue[]; isLive: boolean }) {
  const alerts = useMemo(() => deriveAlerts(venues, isLive), [venues, isLive]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);

  const visible = useMemo(
    () => alerts.filter(a => !dismissed.has(a.id)),
    [alerts, dismissed]
  );

  // Auto-rotate every 5s
  useEffect(() => {
    if (visible.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % visible.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [visible.length]);

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  }, []);

  if (visible.length === 0) return null;

  const alert = visible[currentIdx % visible.length];
  if (!alert) return null;

  return (
    <div className={cn(
      'mx-4 mb-2 p-3 rounded-[14px] border',
      'animate-fadeUp transition-all',
      alert.bgColor, alert.borderColor
    )}>
      <div className="flex items-start gap-2.5">
        <div className={cn('mt-0.5 flex-shrink-0', alert.color)}>
          {alert.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn('text-[12px] font-bold tracking-[-0.01em]', alert.color)}>
              {alert.title}
            </p>
            {visible.length > 1 && (
              <span className="text-[10px] text-[var(--k-text-f)] tabular-nums">
                {(currentIdx % visible.length) + 1}/{visible.length}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--k-text-2)] mt-0.5 leading-[1.35]">{alert.body}</p>
        </div>
        <button
          onClick={() => dismiss(alert.id)}
          aria-label="Dismiss alert"
          className="mt-0.5 w-7 h-7 -mr-1 rounded-full flex items-center justify-center hover:bg-[var(--k-surface)] transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5 text-[var(--k-text-f)]" />
        </button>
      </div>
    </div>
  );
}
