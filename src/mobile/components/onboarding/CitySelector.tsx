import { useState } from 'react';
import { MapPin, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CITIES } from '../../data/cities';
import type { City } from '../../types';

const CITY_META: Record<string, { emoji: string; neighborhoods: string; vibe: string }> = {
  dallas: { emoji: '🤠', neighborhoods: 'Deep Ellum · Uptown · Bishop Arts', vibe: 'Southern hospitality meets nightlife' },
  reno: { emoji: '🎰', neighborhoods: 'Midtown · Downtown · Riverwalk', vibe: 'The Biggest Little City' },
};

export function CitySelector({ onSelect }: { onSelect: (city: City) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSearch = (val: string) => {
    setSearch(val);
    setShowError(false);
    setSelected(null);

    const lower = val.toLowerCase().trim();
    const match = CITIES.find(c =>
      c.name.toLowerCase().includes(lower) ||
      c.state.toLowerCase().includes(lower) ||
      `${c.name} ${c.state}`.toLowerCase().includes(lower)
    );

    if (val.length > 2 && !match) {
      setShowError(true);
    }
  };

  const handleSelect = (city: City) => {
    setSelected(city.id);
    setTimeout(() => onSelect(city), 300);
  };

  return (
    <div className="h-dvh w-full max-w-md mx-auto bg-[#050508] flex flex-col items-center justify-center px-5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-3" />
      </div>

      <div className="relative z-10 w-full max-w-[360px] animate-fadeUp">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ff4d6a]/20 to-[#22d3ee]/15" />
            <div className="absolute inset-[3px] rounded-full bg-[#050508] flex items-center justify-center">
              <MapPin className="w-9 h-9 text-[#ff4d6a]" />
            </div>
          </div>
          <h2 className="font-syne font-extrabold text-[28px] text-white tracking-[-0.02em]">Where are you?</h2>
          <p className="text-white/35 text-[14px] mt-2">Select your city to get started</p>
        </div>

        {/* Search input */}
        <div className="mb-6">
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]
                          focus-within:border-[#ff4d6a]/25 transition-all">
            <Search className="w-4 h-4 text-white/25 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for a city..."
              className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none"
            />
          </div>
          {showError && (
            <p className="text-[#ff8c42] text-[12px] mt-2.5 text-center animate-fadeUp font-medium">
              We're only in Dallas, TX and Reno, NV right now
            </p>
          )}
        </div>

        {/* City cards */}
        <div className="space-y-3">
          {CITIES.map((city, i) => {
            const meta = CITY_META[city.id] || { emoji: '📍', neighborhoods: '', vibe: '' };
            return (
              <button
                key={city.id}
                onClick={() => handleSelect(city)}
                className={cn(
                  'w-full p-5 rounded-2xl border transition-all text-left animate-fadeUp group',
                  selected === city.id
                    ? 'bg-[#ff4d6a]/10 border-[#ff4d6a]/30 shadow-[0_0_30px_rgba(255,77,106,0.1)]'
                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]'
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all',
                    selected === city.id ? 'bg-[#ff4d6a]/15' : 'bg-white/[0.04]'
                  )}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-syne font-bold text-[18px] text-white tracking-[-0.01em]">
                      {city.name}, {city.state}
                    </h3>
                    <p className="text-[12px] text-white/35 mt-0.5">{meta.neighborhoods}</p>
                    <p className="text-[11px] text-white/20 mt-1 italic">{meta.vibe}</p>
                  </div>
                  {selected === city.id && (
                    <div className="w-7 h-7 rounded-full bg-[#ff4d6a] flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
