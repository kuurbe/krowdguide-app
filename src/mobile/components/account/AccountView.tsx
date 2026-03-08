import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, MapPin, ChevronRight, LogOut, Info, Shield, MessageSquare, Bell, Zap } from 'lucide-react';
import { useAppContext } from '../../context';

export function AccountView() {
  const { selectedCity, theme, toggleTheme, walkingMode, setWalkingMode, smartNotifs, setSmartNotifs } = useAppContext();

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-[var(--k-bg)]">
      {/* Profile Header — premium card */}
      <div className="p-6 text-center border-b border-[var(--k-border-s)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at center top, rgba(255,77,106,0.06), transparent 60%)' }} />
        <div className="relative">
          <div className="relative w-[84px] h-[84px] mx-auto mb-4">
            <div className="w-full h-full rounded-[26px] bg-gradient-to-br from-[#ff4d6a]/15 to-[#a855f7]/15
                            flex items-center justify-center text-4xl border border-white/[0.06]
                            shadow-[0_4px_20px_rgba(255,77,106,0.1)]">
              🧑
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-emerald-500 border-2 border-[var(--k-bg)]
                            flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <h2 className="font-syne font-extrabold text-[22px] text-[var(--k-text)] tracking-[-0.02em]">Alex Rivera</h2>
          <p className="text-[13px] text-[var(--k-text-m)] mt-0.5">@arivera</p>
          <Badge className="mt-2.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold text-[11px]">
            <Zap className="w-3 h-3 mr-1" /> Verified Validator
          </Badge>
        </div>
      </div>

      {/* Stats — colorful metric cards */}
      <div className="grid grid-cols-3 gap-2.5 p-4">
        {[
          { label: 'Accuracy', value: '94%', color: '#ff4d6a' },
          { label: 'Votes', value: '52', color: '#a855f7' },
          { label: 'Streak', value: '7', color: '#22d3ee' },
        ].map((stat) => (
          <div key={stat.label} className="p-3.5 rounded-2xl bg-[var(--k-surface-solid)] border border-[var(--k-border)] text-center
                                           shadow-[var(--k-card-shadow)]">
            <span className="font-syne font-extrabold text-[22px]" style={{ color: stat.color }}>{stat.value}</span>
            <p className="text-[11px] text-[var(--k-text-m)] mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Settings Sections */}
      <div className="p-4 space-y-5">
        {/* Current City */}
        <div>
          <h3 className="text-[11px] font-bold text-[#ff4d6a] uppercase tracking-[0.08em] mb-2.5">Location</h3>
          <div className="p-4 rounded-2xl bg-[var(--k-surface-solid)] border border-[var(--k-border)] shadow-[var(--k-card-shadow)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ff4d6a]/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[#ff4d6a]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[var(--k-text)] truncate">{selectedCity.name}, {selectedCity.state}</p>
                <p className="text-[11px] text-[var(--k-text-m)]">Active city</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--k-text-f)] flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div>
          <h3 className="text-[11px] font-bold text-[var(--k-text-m)] uppercase tracking-[0.08em] mb-2.5">Appearance</h3>
          <div className="p-4 rounded-2xl bg-[var(--k-surface-solid)] border border-[var(--k-border)] shadow-[var(--k-card-shadow)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-[var(--k-text)]">Dark Mode</p>
                <p className="text-[11px] text-[var(--k-text-m)]">Easier on your eyes at night</p>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>
          </div>
        </div>

        {/* Smart Features */}
        <div>
          <h3 className="text-[11px] font-bold text-[var(--k-text-m)] uppercase tracking-[0.08em] mb-2.5">Smart Features</h3>
          <div className="rounded-2xl bg-[var(--k-surface-solid)] border border-[var(--k-border)] shadow-[var(--k-card-shadow)]
                          overflow-hidden divide-y divide-[var(--k-border-s)]">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-[var(--k-text)]">Walking Mode</p>
                <p className="text-[11px] text-[var(--k-text-m)]">Proximity crowd prompts</p>
              </div>
              <Switch checked={walkingMode} onCheckedChange={setWalkingMode} />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-[var(--k-text)]">Smart Notifications</p>
                <p className="text-[11px] text-[var(--k-text-m)]">Crowd alerts & happy hours</p>
              </div>
              <Switch checked={smartNotifs} onCheckedChange={setSmartNotifs} />
            </div>
          </div>
        </div>

        {/* Alert Preferences */}
        <div>
          <h3 className="text-[11px] font-bold text-[var(--k-text-m)] uppercase tracking-[0.08em] mb-2.5">Alert Preferences</h3>
          <div className="rounded-2xl bg-[var(--k-surface-solid)] border border-[var(--k-border)] shadow-[var(--k-card-shadow)]
                          overflow-hidden divide-y divide-[var(--k-border-s)]">
            {[
              { icon: '🍻', label: 'Happy Hour', desc: 'Deals & specials starting' },
              { icon: '📈', label: 'Crowd Spikes', desc: 'Venue getting busy fast' },
              { icon: '🌿', label: 'Quiet Spots', desc: 'Low-crowd venues nearby' },
              { icon: '🎉', label: 'Events', desc: 'Local events & happenings' },
            ].map((pref) => (
              <div key={pref.label} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[18px]">{pref.icon}</span>
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--k-text)]">{pref.label}</p>
                    <p className="text-[11px] text-[var(--k-text-m)]">{pref.desc}</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </div>

        {/* General */}
        <div>
          <h3 className="text-[11px] font-bold text-[var(--k-text-m)] uppercase tracking-[0.08em] mb-2.5">General</h3>
          <div className="rounded-2xl bg-[var(--k-surface-solid)] border border-[var(--k-border)] shadow-[var(--k-card-shadow)]
                          overflow-hidden divide-y divide-[var(--k-border-s)]">
            {[
              { icon: Bell, label: 'Notification Settings' },
              { icon: Shield, label: 'Privacy & Security' },
              { icon: MessageSquare, label: 'Send Feedback' },
              { icon: Info, label: 'About KrowdGuide' },
            ].map((item) => (
              <button key={item.label} className="w-full flex items-center gap-3 p-4 hover:bg-[var(--k-surface-h)] transition-colors ios-press">
                <item.icon className="w-5 h-5 text-[var(--k-text-m)] flex-shrink-0" />
                <span className="flex-1 text-[14px] font-medium text-[var(--k-text)] text-left">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-[var(--k-text-f)] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <button className="w-full p-4 rounded-2xl bg-[#ff4d6a]/[0.06] border border-[#ff4d6a]/15
                           flex items-center justify-center gap-2 text-[#ff4d6a] text-[14px] font-bold
                           hover:bg-[#ff4d6a]/[0.12] transition-colors ios-press">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>

        {/* Version info */}
        <div className="text-center py-4">
          <p className="text-[11px] text-[var(--k-text-f)] font-medium">
            KROWD GUIDE v7 · AI + Community Reports
          </p>
        </div>
      </div>

      {/* Bottom spacer for floating nav */}
      <div className="h-24" />
    </div>
  );
}
