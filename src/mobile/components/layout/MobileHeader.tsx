import { Bell, Sun, Moon } from 'lucide-react';
import { useAppContext } from '../../context';

export function MobileHeader({ onBellClick }: { onBellClick: () => void }) {
  const { theme, toggleTheme } = useAppContext();

  return (
    <header className="h-[52px] px-4 flex items-center justify-between bg-[var(--k-overlay)] ios-blur-thick
                        border-b border-[var(--k-border-s)] z-10 flex-shrink-0">
      <div className="font-syne font-extrabold text-[16px] tracking-tight flex items-center gap-0.5">
        <span className="text-[var(--k-text)]">KROWD</span>
        <span className="gradient-text-warm">GUIDE</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 mr-1">
          <div className="live-dot" style={{ width: 6, height: 6 }} />
          <span className="text-emerald-400 text-[10px] font-semibold tracking-wide uppercase">Live</span>
        </div>

        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--k-surface-h)] transition-colors ios-press"
        >
          {theme === 'dark' ? <Sun className="w-[17px] h-[17px] text-[var(--k-text-m)]" /> : <Moon className="w-[17px] h-[17px] text-[var(--k-text-m)]" />}
        </button>
        <button
          onClick={onBellClick}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--k-surface-h)] transition-colors relative ios-press"
        >
          <Bell className="w-[17px] h-[17px] text-[var(--k-text-m)]" />
          <span className="absolute top-1 right-1 w-[8px] h-[8px] rounded-full bg-[#ff4d6a] ring-2 ring-[var(--k-bg)]" />
        </button>
      </div>
    </header>
  );
}
