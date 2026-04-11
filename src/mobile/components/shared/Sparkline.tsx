import { useMemo } from 'react';

/**
 * Sparkline — tiny inline forecast curve.
 * Pass in 0..1 normalized values and it renders a smooth line
 * with a "now" dot and a shaded area fill.
 */
export function Sparkline({
  values,
  width = 56,
  height = 20,
  color = '#ff4d6a',
  showNowDot = true,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  showNowDot?: boolean;
}) {
  const { linePath, areaPath, nowX, nowY } = useMemo(() => {
    if (values.length === 0) return { linePath: '', areaPath: '', nowX: 0, nowY: 0 };
    const step = width / (values.length - 1);
    const points = values.map((v, i) => ({
      x: i * step,
      y: height - Math.max(0, Math.min(1, v)) * height,
    }));

    // Simple line
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    // Filled area (line + bottom baseline closure)
    const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

    return {
      linePath,
      areaPath,
      nowX: points[0].x,
      nowY: points[0].y,
    };
  }, [values, width, height]);

  const gradId = `spark-grad-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {showNowDot && (
        <circle cx={nowX} cy={nowY} r="2" fill={color} stroke="white" strokeWidth="1" />
      )}
    </svg>
  );
}

/** Generate a deterministic forecast curve for a venue (6 hours ahead) */
export function generateForecast(venueId: string, currentPct: number, hours = 6): number[] {
  const seed = venueId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (n: number) => (Math.sin(seed + n * 13) + 1) / 2;
  const hour = new Date().getHours();
  const base = currentPct / 100;
  return Array.from({ length: hours }, (_, i) => {
    const h = (hour + i) % 24;
    // Peak curve: daytime + evening peaks
    const daytimePeak = Math.exp(-Math.pow((h - 13) / 4, 2)) * 0.4;
    const eveningPeak = Math.exp(-Math.pow((h - 21) / 4, 2)) * 0.8;
    const natural = Math.max(0.1, daytimePeak + eveningPeak);
    // Blend with current level + small jitter
    const jitter = (rand(i) - 0.5) * 0.15;
    return Math.max(0.05, Math.min(1, base * 0.4 + natural * 0.6 + jitter));
  });
}
