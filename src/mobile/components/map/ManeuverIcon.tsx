import {
  CornerDownLeft, CornerDownRight, CornerUpLeft, CornerUpRight,
  MoveUp, MapPin, Circle, RotateCw, GitMerge, GitFork, Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManeuverIconProps {
  type: string;
  modifier?: string;
  size?: number;
  active?: boolean;
  className?: string;
}

export function ManeuverIcon({ type, modifier, size = 20, active = false, className }: ManeuverIconProps) {
  const color = active ? 'text-[#22d3ee]' : 'text-[var(--k-text-2)]';
  const props = { className: cn(color, className), style: { width: size, height: size } };

  // Depart / Arrive
  if (type === 'depart') return <Circle {...props} className={cn('text-emerald-400', className)} />;
  if (type === 'arrive') return <MapPin {...props} className={cn('text-[#ff4d6a]', className)} />;

  // Roundabout
  if (type === 'roundabout' || type === 'rotary') return <RotateCw {...props} />;

  // Merge / Fork
  if (type === 'merge') return <GitMerge {...props} />;
  if (type === 'fork') {
    if (modifier?.includes('left')) return <GitFork {...props} style={{ ...props.style, transform: 'scaleX(-1)' }} />;
    return <GitFork {...props} />;
  }

  // U-turn
  if (type === 'turn' && modifier?.includes('uturn')) return <Undo2 {...props} />;

  // Turn + modifier
  if (modifier?.includes('sharp left')) return <CornerUpLeft {...props} />;
  if (modifier?.includes('sharp right')) return <CornerUpRight {...props} />;
  if (modifier?.includes('slight left')) return <CornerDownLeft {...props} />;
  if (modifier?.includes('slight right')) return <CornerDownRight {...props} />;
  if (modifier?.includes('left')) return <CornerDownLeft {...props} />;
  if (modifier?.includes('right')) return <CornerDownRight {...props} />;

  // End of road
  if (type === 'end of road') {
    if (modifier?.includes('left')) return <CornerDownLeft {...props} />;
    return <CornerDownRight {...props} />;
  }

  // Continue / Straight / New name / default
  return <MoveUp {...props} />;
}
