interface ContextFiltersProps {
  crowdFilter: string;
  setCrowdFilter: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  smartSort: boolean;
  setSmartSort: (v: boolean) => void;
  venueCounts?: Record<string, number>;
}

const CROWD_OPTIONS = [
  { id: 'any', label: 'Any', color: '' },
  { id: 'quiet', label: 'Quiet', color: 'var(--k-color-green)' },
  { id: 'moderate', label: 'Moderate', color: 'var(--k-color-amber)' },
  { id: 'busy', label: 'Buzzing', color: 'var(--k-color-coral)' },
];

const TYPE_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food' },
  { id: 'bars', label: 'Bars' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'parks', label: 'Parks' },
];

function Pill({
  label,
  active,
  accentColor,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  accentColor?: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      data-vaul-no-drag
      onPointerDown={(e) => e.stopPropagation()}
      className={`flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95
                  ${active
                    ? 'text-white'
                    : 'bg-transparent border border-[var(--k-border)] text-[var(--k-text-m)] hover:text-[var(--k-text)] hover:border-[var(--k-text-f)]'
                  }`}
      style={active ? {
        backgroundColor: accentColor || 'var(--k-color-coral)',
        boxShadow: `0 2px 16px ${accentColor || 'var(--k-color-coral)'}50, 0 0 4px ${accentColor || 'var(--k-color-coral)'}30`,
      } : undefined}
    >
      {label}
      {active && count !== undefined && count > 0 && (
        <span className="min-w-[16px] h-[16px] rounded-full bg-white/20 text-[9px] font-bold
                         flex items-center justify-center tabular-nums">
          {count}
        </span>
      )}
    </button>
  );
}

export function ContextFilters({
  crowdFilter,
  setCrowdFilter,
  typeFilter,
  setTypeFilter,
  smartSort,
  setSmartSort,
  venueCounts,
}: ContextFiltersProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pill-scroll-fade px-4 py-1">
      {CROWD_OPTIONS.map((o) => (
        <Pill
          key={o.id}
          label={o.label}
          active={crowdFilter === o.id && o.id !== 'any'}
          accentColor={o.color}
          count={venueCounts?.[o.id]}
          onClick={() => setCrowdFilter(crowdFilter === o.id ? 'any' : o.id)}
        />
      ))}
      <div className="w-px h-6 bg-[var(--k-border)] self-center flex-shrink-0" />
      {TYPE_OPTIONS.map((o) => (
        <Pill
          key={o.id}
          label={o.label}
          active={typeFilter === o.id && o.id !== 'all'}
          count={venueCounts?.[o.id]}
          onClick={() => setTypeFilter(typeFilter === o.id ? 'all' : o.id)}
        />
      ))}
      <div className="w-px h-6 bg-[var(--k-border)] self-center flex-shrink-0" />
      <Pill
        label="Best Now"
        active={smartSort}
        accentColor="var(--k-color-purple)"
        onClick={() => setSmartSort(!smartSort)}
      />
    </div>
  );
}
