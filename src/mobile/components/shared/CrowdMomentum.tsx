import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Venue } from '../../types';
import { generateCrowdPrediction, getCurrentHourIndex } from '../../utils/crowdPrediction';

type Trend = 'rising' | 'falling' | 'steady';

function getTrend(venue: Venue): { trend: Trend; label: string } {
  const data = generateCrowdPrediction(venue);
  const hour = getCurrentHourIndex();
  const current = data[hour]?.crowd ?? 50;
  const next = data[(hour + 1) % 24]?.crowd ?? current;
  const diff = next - current;

  if (diff > 5) return { trend: 'rising', label: 'Filling up' };
  if (diff < -5) return { trend: 'falling', label: 'Clearing out' };
  return { trend: 'steady', label: 'Steady' };
}

const TREND_STYLES: Record<Trend, { color: string; Icon: typeof TrendingUp }> = {
  rising: { color: 'var(--k-color-coral)', Icon: TrendingUp },
  falling: { color: 'var(--k-color-green)', Icon: TrendingDown },
  steady: { color: 'var(--k-color-amber)', Icon: Minus },
};

export function CrowdMomentum({ venue }: { venue: Venue }) {
  const { trend, label } = useMemo(() => getTrend(venue), [venue]);
  const { color, Icon } = TREND_STYLES[trend];

  return (
    <span className="inline-flex items-center gap-1" style={{ color }}>
      <Icon className="w-3 h-3" />
      <span className="text-[11px] font-bold leading-none">{label}</span>
    </span>
  );
}
