import { Map, Compass, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'map', icon: Map, label: 'Map' },
  { id: 'guide', icon: Compass, label: 'Guide' },
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
      className="h-[64px] flex items-center justify-around rounded-[28px]
                 bg-[var(--k-elevated)] ios-blur-thick
                 border border-[var(--k-border)]
                 shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.04)]"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-[3px] w-[64px] h-[48px] rounded-2xl transition-all ios-press relative',
              isActive
                ? 'text-[#ff4d6a]'
                : 'text-[var(--k-text-f)] hover:text-[var(--k-text-m)]'
            )}
          >
            {/* Active glow pill background */}
            {isActive && (
              <div className="absolute inset-0 rounded-2xl bg-[#ff4d6a]/[0.10]" />
            )}

            {/* Notification badge on Account */}
            {tab.id === 'account' && (
              <span className="absolute top-0.5 right-2 w-[7px] h-[7px] rounded-full bg-[#ff4d6a] ring-[1.5px] ring-[var(--k-elevated)]" />
            )}

            <tab.icon
              className={cn(
                'w-[21px] h-[21px] transition-all relative z-[1]',
                isActive ? 'stroke-[2.4] nav-icon-glow' : 'stroke-[1.6]'
              )}
            />
            <span className={cn(
              'text-[10px] tracking-[-0.01em] relative z-[1]',
              isActive ? 'font-bold' : 'font-medium'
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
