import { cn } from '@/lib/utils';
import { Layers, UtensilsCrossed, Coffee, Beer, TreePine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const CATEGORIES: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'All', label: 'All', Icon: Layers },
  { id: '🍴 Food', label: 'Food', Icon: UtensilsCrossed },
  { id: '☕ Coffee', label: 'Coffee', Icon: Coffee },
  { id: '🍺 Bars', label: 'Bars', Icon: Beer },
  { id: '🌿 Parks', label: 'Parks', Icon: TreePine },
];

export function CategoryPills({
  active,
  onChange,
}: {
  active: string;
  onChange: (cat: string) => void;
}) {
  return (
    <div className="absolute top-[92px] left-4 right-4 z-[1000] flex gap-2 overflow-x-auto no-scrollbar">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          aria-pressed={active === cat.id}
          className={cn(
            'flex items-center gap-1.5 px-4 py-[10px] text-[12px] font-bold rounded-full whitespace-nowrap transition-all ios-press tracking-[-0.01em]',
            active === cat.id
              ? 'bg-[#ff4d6a] text-white shadow-[0_2px_16px_rgba(255,77,106,0.35)]'
              : 'bg-[var(--k-elevated)] ios-blur text-[var(--k-text-2)] border border-[var(--k-border)] shadow-[var(--k-card-shadow)]'
          )}
        >
          <cat.Icon className={cn('w-3.5 h-3.5', active === cat.id ? 'stroke-[2.2]' : 'stroke-[1.8]')} />
          {cat.label}
        </button>
      ))}
    </div>
  );
}
