import { Bell, Sun, Moon } from 'lucide-react';
import { useAppContext } from '../../context';

export function MobileHeader({ onBellClick }: { onBellClick: () => void }) {
  const { theme, toggleTheme } = useAppContext();

  return (
    <header
      className="h-[44px] px-4 flex items-center justify-between bg-[var(--k-overlay)] ios-blur-thick
                  border-b border-[var(--k-border-s)] z-10 flex-shrink-0"
    >
      {/* Brand — tighter tracking, slightly larger */}
      <div className="font-syne font-extrabold text-[16px] tracking-[-0.03em] flex items-center gap-0.5">
        <span className="text-[var(--k-text)]">KROWD</span>
        <span className="gradient-text-warm">&thinsp;GUIDE</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Live indicator — glass badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 mr-0.5 glass-chip rounded-full">
          <div className="live-dot" style={{ width: 5, height: 5 }} />
          <span className="text-emerald-400 text-[9px] font-bold tracking-[0.05em] uppercase">Live</span>
        </div>

        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--k-surface-h)] transition-colors ios-press"
        >
          {theme === 'dark'
            ? <Sun className="w-[16px] h-[16px] text-[var(--k-text-m)]" />
            : <Moon className="w-[16px] h-[16px] text-[var(--k-text-m)]" />
          }
        </button>
        <button
          onClick={onBellClick}
          aria-label="Notifications"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--k-surface-h)] transition-colors relative ios-press"
        >
          <Bell className="w-[16px] h-[16px] text-[var(--k-text-m)]" />
          <span className="absolute top-1.5 right-1.5 w-[6px] h-[6px] rounded-full bg-[var(--k-accent)] ring-[1.5px] ring-[var(--k-bg)]" />
        </button>
      </div>
    </header>
  );
}
