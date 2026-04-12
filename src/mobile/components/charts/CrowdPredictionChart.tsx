import { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';
import type { Venue } from '../../types';
import {
  generateCrowdPrediction,
  getBestTimeToVisit,
  getCurrentHourIndex,
  getCurrentDayIndex,
  getDayLabel,
} from '../../utils/crowdPrediction';

/* ── colour helpers ── */
function crowdColor(value: number): string {
  if (value >= 70) return 'var(--k-color-coral)';
  if (value >= 40) return 'var(--k-color-amber)';
  return 'var(--k-color-green)';
}

/* ── Custom tooltip ── */
function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { hour: number; crowd: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const { hour, crowd } = payload[0].payload;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return (
    <div className="liquid-glass glass-border-glow rounded-xl px-3 py-1.5 text-[12px] font-semibold text-[var(--k-text)]">
      {displayHour}:00 {period} — {crowd}% crowd
    </div>
  );
}

/* ── X-axis tick labels (show subset) ── */
const VISIBLE_TICKS = new Set([0, 6, 12, 18, 22]);
const TICK_MAP: Record<number, string> = { 0: '12a', 6: '6a', 12: '12p', 18: '6p', 22: '10p' };

/* ── Day selector ── */
const DAYS = [0, 1, 2, 3, 4, 5, 6]; // Sun–Sat

interface CrowdPredictionChartProps {
  venue: Venue;
  mini?: boolean;
}

export function CrowdPredictionChart({ venue, mini = false }: CrowdPredictionChartProps) {
  const [selectedDay, setSelectedDay] = useState(getCurrentDayIndex);
  const nowHour = getCurrentHourIndex();

  const data = useMemo(() => generateCrowdPrediction(venue), [venue]);
  const bestTime = useMemo(() => getBestTimeToVisit(data), [data]);

  const tickFormatter = useCallback(
    (_: string, index: number) => (VISIBLE_TICKS.has(index) ? TICK_MAP[index] ?? '' : ''),
    [],
  );

  /* ── Mini sparkline variant ── */
  if (mini) {
    return (
      <div className="glass-chip rounded-xl px-2 py-1.5" style={{ height: 36 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Bar dataKey="crowd" radius={[2, 2, 0, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.hour} fill={crowdColor(d.crowd)} fillOpacity={0.55} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  /* ── Full variant ── */
  return (
    <div>
      {/* Day-of-week selector */}
      <div className="flex gap-1 mb-2.5 overflow-x-auto no-scrollbar">
        {DAYS.map((day) => {
          const isActive = day === selectedDay;
          const isToday = day === getCurrentDayIndex();
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex-shrink-0
                ${isActive
                  ? 'text-white shadow-lg'
                  : 'text-[var(--k-text-f)] glass-chip hover:text-[var(--k-text)]'
                }`}
              style={isActive ? { background: 'linear-gradient(135deg, #ff6b6b, #ffa726)' } : undefined}
            >
              {getDayLabel(day)}{isToday && !isActive ? ' ·' : ''}
            </button>
          );
        })}
      </div>

      {/* Bar chart */}
      <div className="rounded-xl glass-chip p-3">
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={data} margin={{ top: 14, right: 2, bottom: 0, left: 2 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: 'var(--k-text-f)' }}
              tickFormatter={tickFormatter}
              interval={0}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={false}
              wrapperStyle={{ outline: 'none' }}
            />
            <Bar dataKey="crowd" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {data.map((d) => {
                const isNow = d.hour === nowHour && selectedDay === getCurrentDayIndex();
                return (
                  <Cell
                    key={d.hour}
                    fill={crowdColor(d.crowd)}
                    fillOpacity={isNow ? 1 : 0.5}
                    style={isNow ? { filter: 'drop-shadow(0 0 6px rgba(255,77,106,0.5))' } : undefined}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* "Now" label positioned above the current bar */}
        {selectedDay === getCurrentDayIndex() && (
          <div
            className="text-[9px] font-extrabold text-[var(--k-accent)] uppercase tracking-wider text-center"
            style={{
              marginTop: -100 - 14, // overlay on chart area
              position: 'relative',
              left: `${(nowHour / 23) * 100}%`,
              transform: 'translateX(-50%)',
              width: 'fit-content',
              pointerEvents: 'none',
              opacity: 0, // hide — recharts tooltip suffices
            }}
          >
            Now
          </div>
        )}
      </div>

      {/* Best time pill */}
      <div className="flex items-center gap-2 mt-2.5 px-3 py-2 rounded-xl glass-chip">
        <Clock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        <span className="text-[12px] font-bold text-[var(--k-text)]">
          Best time: {bestTime.label}
        </span>
        <span className="text-[11px] text-[var(--k-text-f)]">· Quietest</span>
      </div>
    </div>
  );
}
