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
      className="h-[60px] flex items-center justify-around rounded-[24px]
                 bg-[var(--k-elevated)] ios-blur-thick
                 border border-[var(--k-border)]
                 shadow-[var(--k-float-shadow)]"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-[3px] w-[72px] h-full rounded-2xl transition-all ios-press relative',
              isActive
                ? 'text-[#ff4d6a]'
                : 'text-[var(--k-text-f)] hover:text-[var(--k-text-m)]'
            )}
          >
            {/* Active glow dot */}
            {isActive && (
              <div className="absolute -top-[1px] w-5 h-[3px] rounded-full bg-[#ff4d6a] shadow-[0_0_8px_rgba(255,77,106,0.5)]" />
            )}
            <tab.icon
              className={cn(
                'w-[22px] h-[22px] transition-all',
                isActive ? 'stroke-[2.4]' : 'stroke-[1.6]'
              )}
            />
            <span className={cn(
              'text-[10px] tracking-[-0.01em]',
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
