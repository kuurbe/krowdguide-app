import { useState, useMemo } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, Clock, MapPin, CheckCircle2, Plus } from 'lucide-react';
import { useAppContext } from '../../context';
import { getAlertsForCity } from '../../data/alerts';
import { ReportDrawer } from './ReportDrawer';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'hh', label: 'Happy Hour' },
  { id: 'food', label: 'Food' },
  { id: 'grocery', label: 'Grocery' },
  { id: 'transit', label: 'Transit' },
  { id: 'park', label: 'Parks' },
];

const TAG_STYLES: Record<string, string> = {
  hh: 'bg-amber-500/[0.12] text-amber-500',
  spike: 'bg-red-500/[0.12] text-red-500',
  park: 'bg-emerald-500/[0.12] text-emerald-500',
  grocery: 'bg-cyan-500/[0.12] text-cyan-500',
  food: 'bg-orange-500/[0.12] text-orange-500',
  transit: 'bg-blue-500/[0.12] text-blue-500',
};

export function AlertsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { selectedCity } = useAppContext();
  const [filter, setFilter] = useState('all');
  const [votes, setVotes] = useState<Record<string, 'up' | 'down' | undefined>>({});
  const [reportOpen, setReportOpen] = useState(false);

  const alerts = useMemo(() => getAlertsForCity(selectedCity.id), [selectedCity.id]);

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(a => a.tag === filter);

  const handleVote = (id: string, dir: 'up' | 'down') => {
    setVotes(prev => ({ ...prev, [id]: prev[id] === dir ? undefined : dir }));
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh] bg-[var(--k-bg)] border-[var(--k-border)]">
          <DrawerHeader className="pb-3 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--k-accent) 6%, transparent), transparent)' }} />
            <div className="flex items-center justify-between relative">
              <div>
                <DrawerTitle className="font-syne text-xl font-bold text-[var(--k-text)] tracking-tight">
                  Live Alerts
                </DrawerTitle>
                <p className="text-[13px] text-[var(--k-text-m)] mt-0.5 tracking-[-0.01em]">
                  {selectedCity.name} · Updated just now
                </p>
              </div>
              <button
                onClick={() => setReportOpen(true)}
                aria-label="Report crowd level"
                className="w-10 h-10 rounded-full bg-[var(--k-accent)]
                           flex items-center justify-center
                           active:scale-95 transition-transform
                           shadow-lg shadow-[var(--k-accent)]/20"
              >
                <Plus className="w-5 h-5 text-white stroke-[2.5]" />
              </button>
            </div>
          </DrawerHeader>

          {/* Filter Chips */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={cn(
                  'px-3.5 py-2 text-[13px] font-semibold rounded-full whitespace-nowrap transition-all ios-press',
                  filter === f.id
                    ? 'bg-[var(--k-accent)] text-white'
                    : 'bg-[var(--k-surface)] text-[var(--k-text-m)] hover:bg-[var(--k-surface-h)]'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
            <div className="space-y-2.5">
              {filteredAlerts.map((alert, i) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-2xl bg-[var(--k-surface-solid)] border border-[var(--k-border)]
                             shadow-[var(--k-card-shadow)] animate-fadeUp"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-[12px] bg-[var(--k-surface)] flex items-center justify-center flex-shrink-0">
                      <span className="text-[20px]">{alert.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title + Tag */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-[14px] text-[var(--k-text)] leading-snug tracking-[-0.02em]">
                          {alert.title}
                        </h4>
                        <span className={cn(
                          'text-[11px] font-semibold capitalize flex-shrink-0 px-2 py-[2px] rounded-full',
                          TAG_STYLES[alert.tag] || 'bg-[var(--k-surface)] text-[var(--k-text-m)]'
                        )}>
                          {alert.tag}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-[12px] text-[var(--k-text-2)] mt-1 leading-[1.4] tracking-[-0.01em]">
                        {alert.text}
                      </p>

                      {/* Trusted badge */}
                      {alert.trusted && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full bg-emerald-500/[0.12] text-emerald-500 text-[10px] font-semibold">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                          </span>
                          <span className="text-[10px] text-[var(--k-text-f)]">8 confirmed</span>
                        </div>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-[var(--k-border-s)]">
                        <span className="flex items-center gap-1 text-[11px] text-[var(--k-text-f)]">
                          <MapPin className="w-3 h-3" /> {alert.loc}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-[var(--k-text-f)]">
                          <Clock className="w-3 h-3" /> {alert.time}
                        </span>
                      </div>

                      {/* Votes */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVote(alert.id, 'up')}
                            aria-label="Vote accurate"
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ios-press',
                              votes[alert.id] === 'up'
                                ? 'bg-emerald-500/[0.15] text-emerald-500'
                                : 'bg-[var(--k-surface)] text-[var(--k-text-m)] hover:bg-[var(--k-surface-h)]'
                            )}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" /> {alert.up + (votes[alert.id] === 'up' ? 1 : 0)}
                          </button>
                          <button
                            onClick={() => handleVote(alert.id, 'down')}
                            aria-label="Vote inaccurate"
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ios-press',
                              votes[alert.id] === 'down'
                                ? 'bg-red-500/[0.15] text-red-500'
                                : 'bg-[var(--k-surface)] text-[var(--k-text-m)] hover:bg-[var(--k-surface-h)]'
                            )}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" /> {alert.dn + (votes[alert.id] === 'down' ? 1 : 0)}
                          </button>
                        </div>
                        <span className="text-[11px] text-[var(--k-accent)] font-medium">Accurate?</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <ReportDrawer open={reportOpen} onOpenChange={setReportOpen} />
    </>
  );
}
