import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Map, Sparkles, Search, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '../../utils/haptics';

const TABS = [
  { id: 'map', icon: Map, label: 'Map' },
  { id: 'ai', icon: Sparkles, label: 'Predict' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'alerts', icon: Bell, label: 'Alerts' },
  { id: 'account', icon: User, label: 'Account' },
] as const;

export function BottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const pillRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);

  // GSAP-powered pill slide with elastic spring + micro-glow
  useEffect(() => {
    if (!pillRef.current || !navRef.current) return;
    const idx = TABS.findIndex(t => t.id === activeTab);
    if (idx < 0) return;
    const buttons = navRef.current.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const btn = buttons[idx];
    if (!btn) return;
    const navRect = navRef.current.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const x = btnRect.left - navRect.left + (btnRect.width - 40) / 2;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isFirstRender.current || prefersReduced) {
      gsap.set(pillRef.current, { x, opacity: 1 });
      isFirstRender.current = false;
      return;
    }

    gsap.to(pillRef.current, {
      x,
      opacity: 1,
      duration: 0.45,
      ease: 'elastic.out(1, 0.55)',
      overwrite: true,
    });

    if (glowRef.current) {
      gsap.fromTo(glowRef.current,
        { x, opacity: 0.6, scale: 1.6 },
        { opacity: 0, scale: 2.2, duration: 0.5, ease: 'power2.out' },
      );
    }
  }, [activeTab]);

  return (
    <nav
      ref={navRef}
      role="tablist"
      aria-label="Main navigation"
      className="h-[52px] flex items-center justify-around rounded-[26px]
                 liquid-glass glass-inner-light promote-layer relative
                 shadow-[var(--k-shadow-lg)]"
    >
      {/* Frosted pill indicator */}
      <div
        ref={pillRef}
        className="absolute top-[6px] left-0 w-[40px] h-[40px] rounded-full
                   nav-pill-indicator
                   pointer-events-none z-0"
        style={{ opacity: 0 }}
      />

      {/* Micro-glow flash */}
      <div
        ref={glowRef}
        className="absolute top-[6px] left-0 w-[40px] h-[40px] rounded-full
                   pointer-events-none z-0"
        style={{
          opacity: 0,
          background: 'radial-gradient(circle, rgba(255,255,255,0.25), transparent 70%)',
          filter: 'blur(8px)',
        }}
      />

      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => { haptic('light'); onTabChange(tab.id); }}
            className={cn(
              'flex items-center justify-center w-[44px] h-[40px] rounded-full transition-all ios-press relative z-[1]',
            )}
          >
            {/* Notification badge on Alerts */}
            {tab.id === 'alerts' && (
              <span className="absolute top-0.5 right-1 w-[5px] h-[5px] rounded-full bg-[var(--k-accent)] ring-[1.5px] ring-[var(--k-glass-bg)]" />
            )}

            <tab.icon
              className={cn(
                'transition-all duration-200',
                isActive
                  ? 'w-[20px] h-[20px] stroke-[2.4] text-[var(--k-text)]'
                  : 'w-[19px] h-[19px] stroke-[1.6] text-[var(--k-text-f)]'
              )}
            />
          </button>
        );
      })}
    </nav>
  );
}
