import {
  Award,
  CalendarDays,
  CircleHelp,
  Home,
  Images,
  Newspaper,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  "/": Home,
  "/events": CalendarDays,
  "/competitions": Trophy,
  "/council": Users,
  "/achievements": Award,
  "/gallery": Images,
  "/newsletter": Newspaper,
  "/about": CircleHelp,
};

export function NavMark({ href, size = 14 }: { href: string; size?: number }) {
  const Icon = icons[href] ?? CircleHelp;
  return <Icon aria-hidden="true" size={size} className="shrink-0" />;
}
