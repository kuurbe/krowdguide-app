import { useState, type ReactNode } from 'react';
import {
  MapPin, Bell, ChevronRight, LogOut, Palette, Moon,
  AlertTriangle, HelpCircle, FileText, Instagram, Twitter, Heart,
} from 'lucide-react';
import { useAppContext } from '../../context';
import type { Venue } from '../../types';

function SettingRow({ icon, title, subtitle, action, onPress }: {
  icon: ReactNode; title: string; subtitle?: string; action: ReactNode; onPress?: () => void;
}) {
  const Tag = onPress ? 'button' : 'div';
  return (
    <Tag onClick={onPress} className="w-full flex items-center gap-3 px-4 py-3.5 ios-press text-left">
      <div className="w-9 h-9 rounded-xl glass-chip flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[var(--k-text)]">{title}</p>
        {subtitle && <p className="text-[11px] text-[var(--k-text-m)] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </Tag>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      className={`relative w-[44px] h-[26px] rounded-full transition-colors duration-200 flex-shrink-0 ${on ? 'bg-emerald-500' : 'bg-[var(--k-surface)]'}`}>
      <div className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-md transition-transform duration-200 ${on ? 'left-[21px]' : 'left-[3px]'}`} />
    </button>
  );
}

export function AccountView() {
  const { theme, toggleTheme, smartNotifs, setSmartNotifs, favorites, toggleFavorite, venues } = useAppContext();
  const [tab, setTab] = useState<'settings' | 'favorites'>('settings');
  const [quietMode, setQuietMode] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState(true);
  const favVenues = venues.filter(v => favorites.has(v.id));

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-[var(--k-bg)] pb-32">
      <div className="px-5 pt-6">
        {/* Profile */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-[72px] h-[72px] rounded-full ring-[2.5px] ring-[#ff6b6b] ring-offset-2 ring-offset-[var(--k-bg)]
                          bg-[var(--k-surface)] flex items-center justify-center text-3xl mb-3">👤</div>
          <h2 className="font-syne text-[20px] font-bold text-[var(--k-text)]">Alex Rivera</h2>
          <p className="text-[13px] text-[var(--k-text-m)] mb-2">@rivera_design</p>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25">
            <span className="w-[6px] h-[6px] rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Verified Validator</span>
          </span>
        </div>

        {/* Stats */}
        <div className="liquid-glass rounded-[16px] flex divide-x divide-[var(--k-border)] mb-6">
          {[{ value: '128', label: 'VISITED' }, { value: String(favorites.size || 42), label: 'FAVORITES' }, { value: '8', label: 'ALERTS' }].map(s => (
            <div key={s.label} className="flex-1 py-3.5 text-center">
              <p className="text-[20px] font-bold text-[var(--k-text)]">{s.value}</p>
              <p className="type-overline text-[var(--k-text-m)] text-[9px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Segment control */}
        <div className="flex gap-1 p-1 rounded-[14px] glass-chip mb-5">
          {(['settings', 'favorites'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-[12px] text-[13px] font-bold transition-all capitalize ${tab === t ? 'bg-[var(--k-accent)] text-white shadow-md' : 'text-[var(--k-text-m)]'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'settings' ? (
          <>
            <p className="type-overline text-[var(--k-text-m)] mb-2 text-[9px]">ACCOUNT PREFERENCES</p>
            <div className="liquid-glass rounded-[16px] divide-y divide-[var(--k-border)] mb-5">
              <SettingRow icon={<MapPin className="w-4 h-4 text-[var(--k-text-m)]" />} title="Location Access" subtitle="Always on for crowd data" action={<ChevronRight className="w-4 h-4 text-[var(--k-text-f)]" />} onPress={() => {}} />
              <SettingRow icon={<Palette className="w-4 h-4 text-[var(--k-text-m)]" />} title="Visual Theme" subtitle={`${theme === 'dark' ? 'Obsidian Dark' : 'Light'} (System Default)`} action={<ChevronRight className="w-4 h-4 text-[var(--k-text-f)]" />} onPress={toggleTheme} />
              <SettingRow icon={<Bell className="w-4 h-4 text-[var(--k-text-m)]" />} title="Smart Notifications" subtitle="Predictive venue alerts" action={<Toggle on={smartNotifs} onChange={setSmartNotifs} />} />
            </div>

            <p className="type-overline text-[var(--k-text-m)] mb-2 text-[9px]">ALERTS & PRIVACY</p>
            <div className="liquid-glass rounded-[16px] divide-y divide-[var(--k-border)] mb-5">
              <SettingRow icon={<Moon className="w-4 h-4 text-[var(--k-text-m)]" />} title="Quiet Mode" subtitle="Alert when venues reach 20% capacity" action={<Toggle on={quietMode} onChange={setQuietMode} />} />
              <SettingRow icon={<AlertTriangle className="w-4 h-4 text-[var(--k-text-m)]" />} title="Capacity Warning" subtitle="Instant push for favorite peak times" action={<Toggle on={capacityWarning} onChange={setCapacityWarning} />} />
            </div>

            <p className="type-overline text-[var(--k-text-m)] mb-2 text-[9px]">GENERAL</p>
            <div className="liquid-glass rounded-[16px] divide-y divide-[var(--k-border)] mb-5">
              <SettingRow icon={<HelpCircle className="w-4 h-4 text-[var(--k-text-m)]" />} title="Help & Support" action={<ChevronRight className="w-4 h-4 text-[var(--k-text-f)]" />} onPress={() => {}} />
              <SettingRow icon={<FileText className="w-4 h-4 text-[var(--k-text-m)]" />} title="Terms of Service" action={<ChevronRight className="w-4 h-4 text-[var(--k-text-f)]" />} onPress={() => {}} />
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[18px] border border-[#ff6b6b]/30 text-[#ff6b6b] text-[14px] font-bold ios-press hover:bg-[#ff6b6b]/10 transition-colors mb-6">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>

            <div className="text-center mb-4">
              <p className="type-overline text-[var(--k-text-f)] text-[9px]">KROWDGUIDE V0.4.0 (BUILD 082)</p>
              <p className="text-[11px] text-[var(--k-text-f)] mt-1">Made with ♥ by Krowd Labs</p>
              <div className="flex items-center justify-center gap-4 mt-3">
                <Instagram className="w-4 h-4 text-[var(--k-text-f)]" />
                <Twitter className="w-4 h-4 text-[var(--k-text-f)]" />
              </div>
            </div>
          </>
        ) : (
          <div>
            {favVenues.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-8 h-8 text-[var(--k-text-f)] mx-auto mb-3" />
                <p className="text-[15px] font-semibold text-[var(--k-text-m)]">No favorites yet</p>
                <p className="text-[12px] text-[var(--k-text-f)] mt-1">Tap the heart on any venue to save it here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {favVenues.map((v: Venue) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-[14px] liquid-glass ios-press">
                    {v.image ? <img src={v.image} alt={v.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-12 h-12 rounded-lg bg-[var(--k-surface)] flex items-center justify-center text-xl flex-shrink-0">{v.icon}</div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-[var(--k-text)] truncate">{v.name}</p>
                      <p className="text-[11px] text-[var(--k-text-m)]">{v.type} · {v.dist}</p>
                    </div>
                    <button onClick={() => toggleFavorite(v.id)} className="ios-press">
                      <Heart className="w-4 h-4 text-[#ff4d6a] fill-[#ff4d6a]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
