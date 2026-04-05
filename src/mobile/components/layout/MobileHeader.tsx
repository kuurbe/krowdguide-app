import { Bell, Cloud, CloudRain, CloudSnow, CloudLightning, CloudSun, Sun, Wind, CloudFog } from 'lucide-react';
import { useAppContext } from '../../context';
import { useWeather } from '../../hooks/useWeather';
import type { WeatherIcon } from '../../types';

const WEATHER_ICONS: Record<WeatherIcon, typeof Cloud> = {
  sun: Sun,
  cloud: Cloud,
  'cloud-sun': CloudSun,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
  'cloud-fog': CloudFog,
  wind: Wind,
};

export function MobileHeader({ onBellClick }: { onBellClick: () => void }) {
  const { selectedCity } = useAppContext();
  const { weather } = useWeather(selectedCity.coordinates);

  const WeatherIconComponent = weather ? WEATHER_ICONS[weather.icon] ?? Cloud : null;

  return (
    <header
      className="h-[48px] px-4 flex items-center justify-between
                  bg-[var(--k-bg)]/80 ios-blur-thick
                  border-b border-[var(--k-border-s)] z-10 flex-shrink-0"
    >
      {/* Brand */}
      <div className="font-syne font-extrabold text-[15px] tracking-[-0.03em] flex items-center gap-0.5">
        <span className="text-[var(--k-text)]">KROWD</span>
        <span className="gradient-text-warm">&thinsp;GUIDE</span>
      </div>

      <div className="flex items-center gap-0.5">
        {/* Weather indicator */}
        {weather && WeatherIconComponent && (
          <div className="flex items-center gap-1 px-2 py-1 mr-0.5 glass-chip-glow rounded-full">
            <WeatherIconComponent className="w-3 h-3 text-[#22d3ee]" />
            <span className="text-[10px] font-bold text-[var(--k-text)] tabular-nums">
              {Math.round(weather.temperature)}°
            </span>
          </div>
        )}

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 mr-1 glass-chip rounded-full">
          <div className="live-dot" style={{ width: 5, height: 5 }} />
          <span className="text-emerald-400 text-[9px] font-bold tracking-[0.05em] uppercase">Live</span>
        </div>

        <button
          onClick={onBellClick}
          aria-label="Notifications"
          className="w-8 h-8 rounded-full flex items-center justify-center
                     hover:bg-[var(--k-surface-h)] transition-colors relative ios-press"
        >
          <Bell className="w-[15px] h-[15px] text-[var(--k-text-m)]" />
          <span className="absolute top-1 right-1 w-[5px] h-[5px] rounded-full bg-[var(--k-accent)] ring-[1.5px] ring-[var(--k-bg)]" />
        </button>
      </div>
    </header>
  );
}
