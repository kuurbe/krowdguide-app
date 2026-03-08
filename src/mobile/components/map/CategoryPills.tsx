import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'All', label: 'All', icon: '' },
  { id: '🍴 Food', label: 'Food', icon: '🍴' },
  { id: '☕ Coffee', label: 'Coffee', icon: '☕' },
  { id: '🍺 Bars', label: 'Bars', icon: '🍺' },
  { id: '🌿 Parks', label: 'Parks', icon: '🌿' },
];

export function CategoryPills({
  active,
  onChange,
}: {
  active: string;
  onChange: (cat: string) => void;
}) {
  return (
    <div className="absolute top-[86px] left-4 right-4 z-[1000] flex gap-2 overflow-x-auto no-scrollbar">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          aria-pressed={active === cat.id}
          className={cn(
            'px-4 py-[9px] text-[12px] font-bold rounded-full whitespace-nowrap transition-all ios-press tracking-[-0.01em]',
            active === cat.id
              ? 'bg-[#ff4d6a] text-white shadow-[0_2px_12px_rgba(255,77,106,0.3)]'
              : 'bg-[var(--k-elevated)] ios-blur text-[var(--k-text-2)] border border-[var(--k-border)] shadow-[var(--k-card-shadow)]'
          )}
        >
          {cat.icon && <span className="mr-1">{cat.icon}</span>}
          {cat.label}
        </button>
      ))}
    </div>
  );
}
