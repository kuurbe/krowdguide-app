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
    <div
      className="flex gap-2 overflow-x-auto no-scrollbar pill-scroll-fade"
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            aria-pressed={isActive}
            style={{
              scrollSnapAlign: 'start',
              ...(isActive ? { boxShadow: 'var(--k-glow-coral)' } : {}),
            }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-[9px] text-[12px] font-bold rounded-full whitespace-nowrap transition-all ios-press tracking-[-0.01em]',
              isActive
                ? 'liquid-glass text-[var(--k-accent)] border-[var(--k-accent)]/25'
                : 'glass-chip text-[var(--k-text-2)] border border-transparent'
            )}
          >
            <cat.Icon className={cn('w-3.5 h-3.5', isActive ? 'stroke-[2.2]' : 'stroke-[1.8]')} />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
