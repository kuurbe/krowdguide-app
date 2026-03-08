import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../../context';

const CROWD_OPTIONS = [
  { id: 'quiet', label: 'Quiet', desc: 'Few people', color: 'bg-emerald-500/[0.08] border-emerald-500/20', dot: 'bg-emerald-500', selectedBg: 'bg-emerald-500/[0.15] border-emerald-500/40 ring-2 ring-emerald-500/20' },
  { id: 'moderate', label: 'Moderate', desc: 'Getting busy', color: 'bg-amber-500/[0.08] border-amber-500/20', dot: 'bg-amber-500', selectedBg: 'bg-amber-500/[0.15] border-amber-500/40 ring-2 ring-amber-500/20' },
  { id: 'busy', label: 'Busy', desc: 'Very crowded', color: 'bg-red-500/[0.08] border-red-500/20', dot: 'bg-red-500', selectedBg: 'bg-red-500/[0.15] border-red-500/40 ring-2 ring-red-500/20' },
] as const;

const CATEGORY_OPTIONS = [
  { id: 'food', label: 'Food' },
  { id: 'hh', label: 'Happy Hour' },
  { id: 'grocery', label: 'Grocery' },
  { id: 'transit', label: 'Transit' },
  { id: 'park', label: 'Parks' },
  { id: 'other', label: 'Other' },
];

export function ReportDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { selectedCity } = useAppContext();
  const [location, setLocation] = useState('');
  const [crowd, setCrowd] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!location.trim() || !crowd) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setLocation('');
      setCrowd(null);
      setCategory(null);
      setNotes('');
      onOpenChange(false);
    }, 2000);
  };

  const canSubmit = location.trim() && crowd;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-[var(--k-bg)] border-[var(--k-border)] overflow-hidden">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="font-syne text-xl font-bold text-[var(--k-text)] tracking-tight">
            Report Crowd Level
          </DrawerTitle>
          <p className="text-[13px] text-[var(--k-text-m)] tracking-[-0.01em]">
            Help the community · {selectedCity.name}
          </p>
        </DrawerHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-syne font-bold text-lg text-[var(--k-text)]">Report Submitted</h3>
            <p className="text-[13px] text-[var(--k-text-m)] mt-1.5 text-center">
              Thanks for helping the community!
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-5">
            {/* Location */}
            <div>
              <label className="text-[13px] font-semibold text-[var(--k-text)] mb-2 block tracking-[-0.01em]">
                Location
              </label>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--k-surface-solid)] border border-[var(--k-border)]
                              focus-within:border-[var(--k-accent)] focus-within:ring-2 focus-within:ring-[var(--k-accent-bg)]
                              transition-all shadow-[var(--k-card-shadow)]">
                <MapPin className="w-4 h-4 text-[var(--k-text-f)] flex-shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Perot Museum, Deep Ellum..."
                  className="flex-1 bg-transparent text-[15px] text-[var(--k-text)] placeholder:text-[var(--k-text-f)] outline-none tracking-[-0.01em]"
                />
              </div>
            </div>

            {/* Crowd Level */}
            <div>
              <label className="text-[13px] font-semibold text-[var(--k-text)] mb-2 block tracking-[-0.01em]">
                Crowd Level
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {CROWD_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setCrowd(opt.id)}
                    className={cn(
                      'p-4 rounded-2xl border transition-all ios-press',
                      crowd === opt.id
                        ? `${opt.selectedBg} scale-[1.02]`
                        : `${opt.color} hover:scale-[1.01]`
                    )}
                  >
                    <div className={cn('w-6 h-6 rounded-full mx-auto shadow-sm', opt.dot)} />
                    <p className="text-[13px] font-semibold text-[var(--k-text)] mt-2.5">{opt.label}</p>
                    <p className="text-[11px] text-[var(--k-text-f)] mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-[13px] font-semibold text-[var(--k-text)] mb-2 block tracking-[-0.01em]">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(category === cat.id ? null : cat.id)}
                    className={cn(
                      'px-3.5 py-[6px] text-[13px] font-medium rounded-full transition-all ios-press',
                      category === cat.id
                        ? 'bg-[var(--k-accent)] text-white'
                        : 'bg-[var(--k-surface)] text-[var(--k-text-m)] hover:bg-[var(--k-surface-h)]'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[13px] font-semibold text-[var(--k-text)] mb-2 block tracking-[-0.01em]">
                Notes <span className="font-normal text-[var(--k-text-f)]">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any extra details?"
                rows={2}
                className="w-full p-3 rounded-xl bg-[var(--k-surface-solid)] border border-[var(--k-border)] text-[15px]
                           text-[var(--k-text)] placeholder:text-[var(--k-text-f)] outline-none resize-none
                           focus:border-[var(--k-accent)] focus:ring-2 focus:ring-[var(--k-accent-bg)]
                           transition-all shadow-[var(--k-card-shadow)] tracking-[-0.01em]"
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full h-12 bg-[var(--k-accent)] hover:opacity-90 text-white font-semibold text-[15px] rounded-xl
                         disabled:opacity-30 disabled:cursor-not-allowed shadow-lg
                         tracking-[-0.01em] ios-press"
            >
              <Send className="w-4 h-4 mr-2" /> Submit Report
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
