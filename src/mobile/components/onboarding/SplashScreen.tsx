import { useState, useEffect } from 'react';
import { MapPin, Navigation, Locate } from 'lucide-react';

export function SplashScreen({ onComplete }: { onComplete: (coords?: { lat: number; lng: number }) => void }) {
  const [phase, setPhase] = useState<'splash' | 'location'>('splash');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setPhase('location'), 2800);
    return () => clearTimeout(timer);
  }, []);

  const handleEnableLocation = () => {
    setLocating(true);
    setLocError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onComplete({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setLocError('Could not get location. Please select a city manually.');
        setTimeout(() => onComplete(), 1500);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSkip = () => onComplete();

  if (phase === 'splash') {
    return (
      <div className="h-dvh w-full max-w-md mx-auto bg-[#050508] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Aurora mesh background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508]/80" />
        </div>

        <div className="animate-splash relative z-10 flex flex-col items-center">
          {/* Logo mark */}
          <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-[#ff4d6a]/20 via-[#a855f7]/15 to-[#22d3ee]/10
                          flex items-center justify-center mb-10 border border-white/[0.06]
                          shadow-[0_0_60px_rgba(255,77,106,0.15)]">
            <span className="font-syne font-extrabold text-3xl tracking-tight gradient-text-warm">KG</span>
          </div>

          <h1 className="font-syne font-extrabold text-[42px] leading-[1] tracking-[-0.03em] text-center">
            <span className="text-white">KROWD</span>
            <span className="gradient-text-warm">GUIDE</span>
          </h1>

          <p className="text-white/35 text-[13px] mt-4 tracking-[0.12em] uppercase font-medium">
            Real-time crowd intelligence
          </p>

          {/* Loading indicator */}
          <div className="mt-14 flex items-center gap-2">
            <div className="w-8 h-[3px] rounded-full bg-gradient-to-r from-[#ff4d6a] to-[#a855f7] animate-pulse" />
            <div className="w-5 h-[3px] rounded-full bg-white/10 animate-pulse" style={{ animationDelay: '200ms' }} />
            <div className="w-3 h-[3px] rounded-full bg-white/10 animate-pulse" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full max-w-md mx-auto bg-[#050508] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508]/60" />
      </div>

      <div className="relative z-10 w-full max-w-[340px] animate-fadeUp">
        <div className="text-center mb-10">
          {/* Location icon with glow ring */}
          <div className="w-24 h-24 mx-auto mb-7 rounded-full relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ff4d6a]/25 to-[#a855f7]/15 animate-pulse" />
            <div className="absolute inset-[3px] rounded-full bg-[#050508] flex items-center justify-center">
              <Locate className="w-10 h-10 text-[#ff4d6a]" />
            </div>
          </div>
          <h2 className="font-syne font-extrabold text-[28px] text-white leading-tight tracking-[-0.02em]">
            Enable Location
          </h2>
          <p className="text-white/40 text-[14px] mt-3 leading-relaxed">
            See live crowd data for<br />nearby venues and events
          </p>
        </div>

        <button
          onClick={handleEnableLocation}
          disabled={locating}
          className="btn-glow w-full py-[18px] rounded-2xl bg-gradient-to-r from-[#ff4d6a] to-[#a855f7] text-white
                     font-bold text-[16px] flex items-center justify-center gap-3
                     active:scale-[0.98] transition-all
                     disabled:opacity-60 tracking-[-0.01em]"
        >
          {locating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Locating...
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5" />
              Enable Location
            </>
          )}
        </button>

        {locError && (
          <p className="text-amber-400 text-xs mt-3 text-center animate-fadeUp">{locError}</p>
        )}

        <button
          onClick={handleSkip}
          className="w-full mt-5 py-3 text-[14px] text-white/25 hover:text-white/50 transition-colors font-medium"
        >
          Select city manually
        </button>
      </div>
    </div>
  );
}
