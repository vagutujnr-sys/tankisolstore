import { Briefcase, CheckSquare, GraduationCap, HeartPulse, Sprout, Car, ShoppingBag, MessageCircle, Clapperboard, Wrench, Users, LayoutGrid, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { Briefcase, CheckSquare, GraduationCap, HeartPulse, Sprout, Car, ShoppingBag, MessageCircle, Clapperboard, Wrench, Users, LayoutGrid };

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? LayoutGrid;
  return <Icon className={className} />;
}
export const CATEGORY_ICON_NAMES = Object.keys(ICONS);
