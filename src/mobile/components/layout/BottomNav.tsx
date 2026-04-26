import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Map, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '../../utils/haptics';

const TABS = [
  { id: 'map', icon: Map, label: 'MAP' },
  { id: 'ai', icon: Sparkles, label: 'PREDICT' },
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
  const navRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);
  const prevIdx = useRef(0);

  useEffect(() => {
    if (!pillRef.current || !navRef.current) return;
    const idx = TABS.findIndex(t => t.id === activeTab);
    if (idx < 0) return;

    const buttons = navRef.current.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const btn = buttons[idx];
    if (!btn) return;

    const navRect = navRef.current.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    // Center pill under button — pill matches button width
    const x = btnRect.left - navRect.left + 2;
    const w = btnRect.width - 4;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isFirstRender.current || prefersReduced) {
      gsap.set(pillRef.current, { x, width: w, opacity: 1 });
      isFirstRender.current = false;
      prevIdx.current = idx;
      return;
    }

    // Calculate travel distance for adaptive duration
    const distance = Math.abs(idx - prevIdx.current);
    const duration = 0.3 + distance * 0.06; // Longer for bigger jumps

    // Smooth spring slide — no bounce, just fluid
    gsap.to(pillRef.current, {
      x,
      width: w,
      opacity: 1,
      duration,
      ease: 'power3.out',
      overwrite: true,
    });

    // Scale bump on the active icon
    const iconEl = btn.querySelector('svg');
    if (iconEl) {
      gsap.fromTo(iconEl, { scale: 0.8 }, { scale: 1, duration: 0.25, ease: 'back.out(2)' });
    }

    prevIdx.current = idx;
  }, [activeTab]);

  return (
    <nav
      ref={navRef}
      role="tablist"
      aria-label="Main navigation"
      className="h-[58px] flex items-center justify-around rounded-[29px]
                 liquid-glass glass-inner-light promote-layer relative
                 shadow-[var(--k-shadow-lg)]"
    >
      {/* Sliding pill indicator — fluid width matches button */}
      <div
        ref={pillRef}
        className="absolute top-[3px] left-0 h-[52px] rounded-[24px]
                   pointer-events-none z-0"
        style={{
          opacity: 0,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(104,219,174,0.20), rgba(255,255,255,0.08) 70%)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 0 20px rgba(104,219,174,0.08), 0 4px 12px rgba(0,0,0,0.15)',
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
              'flex flex-col items-center justify-center w-[56px] h-[52px] rounded-[24px] transition-all relative z-[1] gap-[2px]',
              isActive ? 'active:scale-[0.92]' : 'active:scale-[0.88] ios-press',
            )}
          >
            {/* No notification badges on nav tabs */}

            <tab.icon
              className={cn(
                'transition-all duration-200',
                isActive
                  ? 'w-[19px] h-[19px] stroke-[2.4] text-white'
                  : 'w-[17px] h-[17px] stroke-[1.5] text-[var(--k-text-f)]'
              )}
            />
            <span className={cn(
              'text-[8px] font-bold tracking-[0.03em] transition-all duration-200',
              isActive ? 'text-[var(--k-color-mint)] opacity-100' : 'text-[var(--k-text-f)] opacity-70'
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
