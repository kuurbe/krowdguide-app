import { Map, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'map', icon: Map, label: 'Map' },
  { id: 'ai', icon: Sparkles, label: 'Predict' },
  { id: 'account', icon: User, label: 'Account' },
] as const;

export function BottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <nav
      role="tablist"
      aria-label="Main navigation"
      className="h-[60px] flex items-center justify-around rounded-[22px]
                 bg-[var(--k-elevated)] ios-blur-thick
                 border border-[var(--k-border)]
                 shadow-[0_4px_24px_rgba(0,0,0,0.25),0_0_0_0.5px_rgba(255,255,255,0.04)]"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-[2px] w-[72px] h-[44px] rounded-[14px] transition-all ios-press relative',
              isActive
                ? 'text-[var(--k-accent)]'
                : 'text-[var(--k-text-f)] hover:text-[var(--k-text-m)]'
            )}
          >
            {/* Active pill background */}
            {isActive && (
              <div className="absolute inset-0 rounded-[14px] bg-[var(--k-accent)]/[0.10]" />
            )}

            {/* Notification badge on Account */}
            {tab.id === 'account' && (
              <span className="absolute top-0 right-3 w-[6px] h-[6px] rounded-full bg-[var(--k-accent)] ring-[1.5px] ring-[var(--k-elevated)]" />
            )}

            <tab.icon
              className={cn(
                'w-[20px] h-[20px] transition-all relative z-[1]',
                isActive ? 'stroke-[2.4] nav-icon-glow' : 'stroke-[1.6]'
              )}
            />
            <span className={cn(
              'text-[10px] tracking-[-0.01em] relative z-[1] leading-tight',
              isActive ? 'font-semibold' : 'font-medium'
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
