import { useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Plus, MapPin, Moon, Vibrate, Trash2, ChevronRight } from 'lucide-react';

type TimeGranularity = 'immediate' | '30m' | '1h';

interface AlertConfig {
  id: string;
  name: string;
  threshold: number;
  enabled: boolean;
  time: TimeGranularity;
  snoozed?: string;
  color: string;
}

const INITIAL_ALERTS: AlertConfig[] = [
  { id: '1', name: 'Central Plaza', threshold: 95, enabled: true, time: 'immediate', color: 'var(--k-color-coral)' },
  { id: '2', name: 'Main Station', threshold: 40, enabled: false, time: '30m', snoozed: 'Alerts paused until Monday 8:00 AM', color: 'var(--k-color-amber)' },
  { id: '3', name: 'Oxford District', threshold: 60, enabled: true, time: '1h', color: 'var(--k-color-green)' },
];

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-[44px] h-[26px] rounded-full transition-colors duration-200 flex-shrink-0
        ${checked ? 'bg-emerald-500' : 'bg-[var(--k-surface)]'}`}
    >
      <div
        className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-md transition-transform duration-200
          ${checked ? 'left-[21px]' : 'left-[3px]'}`}
      />
    </button>
  );
}

export function AlertsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const setAlertTime = (id: string, time: TimeGranularity) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, time } : a));
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="liquid-glass glass-border-glow rounded-t-[20px] max-h-[85vh] flex flex-col">
        <div className="overflow-y-auto no-scrollbar flex-1 px-5 pb-8 pt-2">

          {/* Header */}
          <h1 className="font-syne text-[24px] font-black text-[var(--k-text)] tracking-[-0.02em] mt-2">
            Alerts
          </h1>
          <p className="text-[13px] text-[var(--k-text-m)] mt-1 mb-5">
            Manage your crowd density notifications.
          </p>

          {/* New Alert button */}
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-[18px]
                             border border-[var(--k-color-coral)] text-[var(--k-color-coral)] text-[14px] font-bold
                             ios-press hover:bg-[var(--k-color-coral)]/10 transition-colors mb-6">
            <Plus className="w-4 h-4" />
            New Alert
          </button>

          {/* Active Notifications */}
          <p className="type-overline text-[var(--k-text-m)] mb-3">ACTIVE NOTIFICATIONS</p>

          <div className="space-y-3 mb-6">
            {alerts.map((alert) => (
              <div key={alert.id} className="liquid-glass rounded-[16px] p-4">
                {/* Main row */}
                <div className="flex items-center gap-3">
                  {/* Icon circle */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                       style={{ border: `2px solid ${alert.color}`, background: `${alert.color}15` }}>
                    <MapPin className="w-4 h-4" style={{ color: alert.color }} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-[var(--k-text)]">{alert.name}</p>
                    <p className="text-[13px] text-[var(--k-text-m)]">
                      Density: <span className="font-semibold" style={{ color: alert.color }}>{alert.threshold}%</span> threshold
                    </p>
                  </div>

                  {/* Toggle */}
                  <ToggleSwitch checked={alert.enabled} onChange={() => toggleAlert(alert.id)} />
                </div>

                {/* Time granularity pills */}
                <div className="flex gap-2 mt-3">
                  {(['immediate', '30m', '1h'] as TimeGranularity[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAlertTime(alert.id, t)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ios-press
                        ${alert.time === t
                          ? 'bg-[var(--k-color-coral)] text-white'
                          : 'glass-chip text-[var(--k-text-m)]'
                        }`}
                    >
                      {t === 'immediate' ? 'Immediate' : t.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Snoozed label */}
                {alert.snoozed && (
                  <p className="text-[11px] italic text-[var(--k-text-m)] mt-2 ml-[52px]">
                    {alert.snoozed}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Global Settings */}
          <p className="type-overline text-[var(--k-text-m)] mb-3">GLOBAL SETTINGS</p>

          <div className="liquid-glass rounded-[16px] divide-y divide-[var(--k-border)]">
            {/* Quiet Hours */}
            <button className="w-full flex items-center gap-3 px-4 py-3.5 ios-press">
              <div className="w-8 h-8 rounded-full glass-chip flex items-center justify-center">
                <Moon className="w-4 h-4 text-[var(--k-text-m)]" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[14px] font-semibold text-[var(--k-text)]">Quiet Hours</p>
              </div>
              <span className="text-[13px] text-[var(--k-text-m)] mr-1">22:00 - 07:00</span>
              <ChevronRight className="w-4 h-4 text-[var(--k-text-f)]" />
            </button>

            {/* Haptic Feedback */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-full glass-chip flex items-center justify-center">
                <Vibrate className="w-4 h-4 text-[var(--k-text-m)]" />
              </div>
              <p className="flex-1 text-[14px] font-semibold text-[var(--k-text)]">Haptic Feedback</p>
              <ToggleSwitch checked={hapticEnabled} onChange={setHapticEnabled} />
            </div>

            {/* Clear All History */}
            <button className="w-full flex items-center gap-3 px-4 py-3.5 ios-press">
              <div className="w-8 h-8 rounded-full glass-chip flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <p className="flex-1 text-left text-[14px] font-semibold text-red-400">Clear All History</p>
            </button>
          </div>

        </div>
      </DrawerContent>
    </Drawer>
  );
}
