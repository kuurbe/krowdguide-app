import { cn } from '@/lib/utils';

const colors = {
  quiet: 'text-emerald-400 bg-emerald-400/10',
  moderate: 'text-amber-400 bg-amber-400/10',
  busy: 'text-rose-400 bg-rose-400/10',
};

export function CrowdPill({ crowd, pct }: { crowd: string; pct: number }) {
  return (
    <span className={cn('crowd-pill', colors[crowd as keyof typeof colors])}>
      {pct}%
    </span>
  );
}
