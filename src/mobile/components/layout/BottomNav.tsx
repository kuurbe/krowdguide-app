import { Map, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '../../utils/haptics';

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
      className="h-[56px] flex items-center justify-around rounded-[24px]
                 liquid-glass promote-layer
                 shadow-[var(--k-shadow-lg)]"
    >
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
              'flex flex-col items-center justify-center gap-[3px] w-[72px] h-[44px] rounded-[14px] transition-all ios-press relative',
              isActive
                ? 'text-[var(--k-accent)]'
                : 'text-[var(--k-text-f)] hover:text-[var(--k-text-m)]'
            )}
          >
            {/* Notification badge on Account */}
            {tab.id === 'account' && (
              <span className="absolute top-0 right-3 w-[6px] h-[6px] rounded-full bg-[var(--k-accent)] ring-[1.5px] ring-[var(--k-glass-bg)]" />
            )}

            <tab.icon
              className={cn(
                'w-[20px] h-[20px] transition-all relative z-[1]',
                isActive ? 'stroke-[2.4]' : 'stroke-[1.6]'
              )}
              style={isActive ? { filter: 'var(--k-neon-coral)' } : undefined}
            />
            <span className={cn(
              'text-[10px] tracking-[-0.01em] relative z-[1] leading-tight',
              isActive ? 'font-bold' : 'font-medium'
            )}>
              {tab.label}
            </span>

            {/* Active dot indicator */}
            {isActive && (
              <div className="absolute -bottom-0.5 w-[4px] h-[4px] rounded-full bg-[var(--k-accent)]"
                   style={{ boxShadow: 'var(--k-glow-coral)' }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
