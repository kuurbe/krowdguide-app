import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Map, Sparkles, Search, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '../../utils/haptics';

const TABS = [
  { id: 'map', icon: Map, label: 'MAP' },
  { id: 'ai', icon: Sparkles, label: 'PREDICT' },
  { id: 'search', icon: Search, label: 'SEARCH' },
  { id: 'alerts', icon: Bell, label: 'ALERTS' },
  { id: 'account', icon: User, label: 'ACCOUNT' },
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

  useEffect(() => {
    if (!pillRef.current || !navRef.current) return;
    const idx = TABS.findIndex(t => t.id === activeTab);
    if (idx < 0) return;
    const buttons = navRef.current.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const btn = buttons[idx];
    if (!btn) return;
    const navRect = navRef.current.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const pillW = 44;
    const x = btnRect.left - navRect.left + (btnRect.width - pillW) / 2;

    if (isFirstRender.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(pillRef.current, { x, opacity: 1 });
      isFirstRender.current = false;
      return;
    }

    gsap.to(pillRef.current, { x, opacity: 1, duration: 0.45, ease: 'elastic.out(1, 0.55)', overwrite: true });

    if (glowRef.current) {
      gsap.fromTo(glowRef.current, { x, opacity: 0.6, scale: 1.4 }, { opacity: 0, scale: 2, duration: 0.5, ease: 'power2.out' });
    }
  }, [activeTab]);

  return (
    <nav
      ref={navRef}
      role="tablist"
      aria-label="Main navigation"
      className="h-[60px] flex items-center justify-around rounded-[30px]
                 liquid-glass glass-inner-light promote-layer relative
                 shadow-[var(--k-shadow-lg)]"
    >
      {/* Frosted pill indicator */}
      <div
        ref={pillRef}
        className="absolute top-[4px] left-0 w-[44px] h-[52px] rounded-[22px]
                   nav-pill-indicator pointer-events-none z-0"
        style={{ opacity: 0 }}
      />

      {/* Micro-glow */}
      <div
        ref={glowRef}
        className="absolute top-[4px] left-0 w-[44px] h-[52px] rounded-[22px]
                   pointer-events-none z-0"
        style={{ opacity: 0, background: 'radial-gradient(circle, rgba(255,255,255,0.2), transparent 70%)', filter: 'blur(8px)' }}
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
              'flex flex-col items-center justify-center w-[52px] h-[52px] rounded-[22px] transition-all ios-press relative z-[1] gap-[2px]',
            )}
          >
            {tab.id === 'alerts' && (
              <span className="absolute top-1 right-2 w-[5px] h-[5px] rounded-full bg-[var(--k-accent)] ring-[1.5px] ring-[var(--k-glass-bg)]" />
            )}

            <tab.icon
              className={cn(
                'transition-all duration-200',
                isActive
                  ? 'w-[18px] h-[18px] stroke-[2.4] text-[var(--k-text)]'
                  : 'w-[17px] h-[17px] stroke-[1.6] text-[var(--k-text-f)]'
              )}
            />
            <span className={cn(
              'text-[8px] font-bold tracking-[0.04em] transition-colors duration-200',
              isActive ? 'text-[#ff4d6a]' : 'text-[var(--k-text-f)]'
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
