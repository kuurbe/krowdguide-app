import { useState, useEffect, useRef } from 'react';
import { Navigation, Locate } from 'lucide-react';
import gsap from 'gsap';

/** Tiny floating particle dots for ambient depth */
function Particles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[2px] h-[2px] rounded-full bg-white/20"
          style={{
            top: `${15 + Math.random() * 70}%`,
            left: `${10 + Math.random() * 80}%`,
            animation: `float ${5 + i * 0.8}s ease-in-out infinite ${i * 0.6}s`,
            opacity: 0.15 + Math.random() * 0.2,
          }}
        />
      ))}
    </div>
  );
}

export function SplashScreen({ onComplete }: { onComplete: (coords?: { lat: number; lng: number }) => void }) {
  const [phase, setPhase] = useState<'splash' | 'location'>('splash');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  // GSAP refs
  const splashRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const krowdRef = useRef<HTMLSpanElement>(null);
  const guideRef = useRef<HTMLSpanElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbsRef = useRef<HTMLDivElement>(null);

  // Respect prefers-reduced-motion
  const prefersReduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // GSAP splash animation sequence
  useEffect(() => {
    if (phase !== 'splash') return;

    if (prefersReduced) {
      // Skip animations, just show and advance
      const timer = setTimeout(() => setPhase('location'), 1200);
      return () => clearTimeout(timer);
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => setPhase('location'),
      });

      // Orbs scale in with stagger
      if (orbsRef.current) {
        tl.from(orbsRef.current.children, {
          scale: 0,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        }, 0);
      }

      // Logo icon — elastic entrance
      tl.from(logoRef.current, {
        scale: 0.5,
        opacity: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)',
      }, 0.2);

      // "KROWD" text slides in
      tl.from(krowdRef.current, {
        opacity: 0,
        x: -20,
        duration: 0.4,
        ease: 'power3.out',
      }, 0.5);

      // "GUIDE" slides up
      tl.from(guideRef.current, {
        opacity: 0,
        y: 15,
        duration: 0.4,
        ease: 'power3.out',
      }, 0.8);

      // Tagline fades up
      tl.from(taglineRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.4,
        ease: 'power2.out',
      }, 1.2);

      // Progress bar sweeps
      tl.to(progressRef.current, {
        width: '100%',
        duration: 1.6,
        ease: 'power1.inOut',
      }, 1.0);

      // Exit — scale up and fade
      tl.to(containerRef.current, {
        scale: 1.05,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
      }, 2.6);
    }, splashRef);

    return () => ctx.revert();
  }, [phase, prefersReduced]);

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
      <div ref={splashRef} className="h-dvh w-full bg-[#050508] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Mesh gradient orbs */}
        <div ref={orbsRef} className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508]/80" />
        </div>

        {/* Floating particles */}
        <Particles />

        <div ref={containerRef} className="relative z-10 flex flex-col items-center">
          {/* Logo mark */}
          <div
            ref={logoRef}
            className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-[#ff4d6a]/20 via-[#a855f7]/15 to-[#22d3ee]/10
                        flex items-center justify-center mb-10 border border-white/[0.06]
                        shadow-[0_0_60px_rgba(255,77,106,0.15)]"
          >
            <span className="font-syne font-extrabold text-3xl tracking-tight gradient-text-warm">KG</span>
          </div>

          <h1 className="font-syne font-extrabold text-[42px] leading-[1] tracking-[-0.03em] text-center">
            <span ref={krowdRef} className="text-white inline-block">KROWD</span>
            <span ref={guideRef} className="gradient-text-warm inline-block">GUIDE</span>
          </h1>

          <p ref={taglineRef} className="text-white/35 text-[13px] mt-4 tracking-[0.12em] uppercase font-medium"
             style={{ letterSpacing: '0.14em' }}>
            Real-time crowd intelligence
          </p>

          {/* Shimmer progress bar */}
          <div className="mt-14 w-32 h-[3px] rounded-full bg-white/10 overflow-hidden">
            <div ref={progressRef} className="h-full w-0 rounded-full bg-gradient-to-r from-[#ff4d6a] via-[#a855f7] to-[#22d3ee]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full bg-[#050508] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508]/60" />
      </div>

      <Particles />

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
