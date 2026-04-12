import type { LucideProps } from 'lucide-react';
import {
  Music,
  Palette,
  Wine,
  UtensilsCrossed,
  TreePine,
  Landmark,
  Coffee,
  Dice5,
  Waves,
  House,
  GraduationCap,
  Beef,
  Beer,
  Fish,
  Sandwich,
  ShoppingBag,
  Camera,
  Leaf,
  Footprints,
  MapPin,
  PartyPopper,
  Clock,
  AlertTriangle,
  ShoppingCart,
  Bus,
  Target,
  Zap,
  User,
  Sunset,
  Sun,
  Circle,
  Flame,
} from 'lucide-react';
import type { ComponentType } from 'react';

const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  music: Music,
  palette: Palette,
  cocktail: Wine,
  utensils: UtensilsCrossed,
  tree: TreePine,
  landmark: Landmark,
  coffee: Coffee,
  dice: Dice5,
  waves: Waves,
  home: House,
  graduation: GraduationCap,
  meat: Beef,
  beer: Beer,
  sushi: Fish,
  burger: Sandwich,
  shopping: ShoppingBag,
  camera: Camera,
  leaf: Leaf,
  running: Footprints,
  cowboy: MapPin,
  party: PartyPopper,
  pin: MapPin,
  cheers: Beer,
  timer: Clock,
  alert: AlertTriangle,
  cart: ShoppingCart,
  bus: Bus,
  target: Target,
  zap: Zap,
  user: User,
  sunset: Sunset,
  sun: Sun,
  flame: Flame,
};

export function VenueIcon({
  iconId,
  className,
  style,
}: {
  iconId: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = ICON_MAP[iconId] ?? Circle;
  return <Icon className={className} style={style} />;
}
