import { User, Cloud, CloudRain, CloudSnow, CloudLightning, CloudSun, Sun, Wind, CloudFog } from 'lucide-react';
import { useAppContext } from '../../context';
import { useWeather } from '../../hooks/useWeather';
import type { WeatherIcon } from '../../types';

const WEATHER_ICONS: Record<WeatherIcon, typeof Cloud> = {
  sun: Sun, cloud: Cloud, 'cloud-sun': CloudSun, 'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow, 'cloud-lightning': CloudLightning, 'cloud-fog': CloudFog, wind: Wind,
};

export function MobileHeader({ onBellClick }: { onBellClick: () => void }) {
  const { selectedCity } = useAppContext();
  const { weather } = useWeather(selectedCity.coordinates);
  const WeatherIconComponent = weather ? WEATHER_ICONS[weather.icon] ?? Cloud : null;

  return (
    <header className="h-[48px] px-4 flex items-center justify-between bg-[var(--k-bg)]/80 ios-blur-thick border-b border-[var(--k-border-s)] z-10 flex-shrink-0">
      {/* Brand icon + name */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#ff4d6a]/15 flex items-center justify-center">
          <span className="text-[12px] font-black text-[#ff4d6a]">KG</span>
        </div>
        <span className="font-syne font-black text-[14px] tracking-[0.06em] text-[var(--k-text)] uppercase">
          KrowdGuide
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Weather */}
        {weather && WeatherIconComponent && (
          <div className="flex items-center gap-1 px-2 py-1 glass-chip-glow rounded-full">
            <WeatherIconComponent className="w-3 h-3 text-[#22d3ee]" />
            <span className="text-[10px] font-bold text-[var(--k-text)] tabular-nums">{Math.round(weather.temperature)}°</span>
          </div>
        )}

        {/* Avatar button */}
        <button
          onClick={onBellClick}
          aria-label="Profile & notifications"
          className="w-8 h-8 rounded-full glass-chip flex items-center justify-center ios-press relative"
        >
          <User className="w-[14px] h-[14px] text-[var(--k-text-m)]" />
          <span className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] rounded-full bg-[#ff4d6a] ring-[1.5px] ring-[var(--k-bg)]" />
        </button>
      </div>
    </header>
  );
}
