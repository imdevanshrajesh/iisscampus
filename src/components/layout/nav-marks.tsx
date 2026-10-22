import {
  Award,
  CalendarDays,
  CircleHelp,
  HeartPulse,
  Home,
  Images,
  MessageSquare,
  Newspaper,
  School,
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
  "/wellness": HeartPulse,
  "/about": CircleHelp,
  "/suggestions": MessageSquare,
};

function iconFor(href: string, label = "") {
  const path = href.split("?")[0].split("#")[0];
  if (path === "/") return Home;
  const match = Object.keys(icons)
    .filter((key) => key !== "/" && (path === key || path.startsWith(`${key}/`)))
    .sort((a, b) => b.length - a.length)[0];
  if (match) return icons[match];

  const text = label.toLowerCase();
  if (text.includes("home")) return Home;
  if (text.includes("comp")) return Trophy;
  if (text.includes("event")) return CalendarDays;
  if (text.includes("council")) return Users;
  if (text.includes("gallery") || text.includes("photo")) return Images;
  if (text.includes("letter") || text.includes("news")) return Newspaper;
  if (text.includes("well")) return HeartPulse;
  if (text.includes("achiev") || text.includes("award")) return Award;
  if (text.includes("suggest")) return MessageSquare;
  if (text.includes("school")) return School;
  return CircleHelp;
}

export function NavMark({ href = "", label, size = 14 }: { href?: string | null; label?: string; size?: number }) {
  const Icon = iconFor(href ?? "", label);
  return <Icon aria-hidden="true" size={size} className="shrink-0" />;
}
