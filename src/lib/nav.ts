export type NavLink = { href: string; label: string };

export const primaryNav: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/competitions", label: "Competitions" },
  { href: "/council", label: "Council" },
  { href: "/achievements", label: "Achievements" },
  { href: "/gallery", label: "Gallery" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/wellness", label: "Wellness" },
  { href: "/about", label: "FAQ & About" },
];

export function withWellnessNavLabel(navLabel?: string | null): NavLink[] {
  const label = navLabel?.trim() || "Wellness";
  return primaryNav.map((link) => (link.href === "/wellness" ? { ...link, label } : link));
}
