export type CategoryTheme = {
  name: string;
  badge: string;
  glow: string;
  accent: string;
  border: string;
  dot: string;
  bgLight: string;
};

const styles: Record<string, CategoryTheme> = {
  // Sports -> Blue
  sports: {
    name: "Sports",
    badge: "bg-blue-500/10 text-blue-700 ring-blue-500/20 border-blue-500/30",
    glow: "rgba(37, 99, 235, 0.25)",
    accent: "#2563eb",
    border: "border-blue-400/40",
    dot: "bg-blue-600",
    bgLight: "bg-blue-50/70",
  },
  // Academic & Exams -> Red / Crimson
  academic: {
    name: "Academics",
    badge: "bg-rose-500/10 text-rose-700 ring-rose-500/20 border-rose-500/30",
    glow: "rgba(225, 29, 72, 0.25)",
    accent: "#e11d48",
    border: "border-rose-400/40",
    dot: "bg-rose-600",
    bgLight: "bg-rose-50/70",
  },
  // Cultural & Arts -> Purple / Violet
  cultural: {
    name: "Arts & Culture",
    badge: "bg-purple-500/10 text-purple-700 ring-purple-500/20 border-purple-500/30",
    glow: "rgba(147, 51, 234, 0.25)",
    accent: "#9333ea",
    border: "border-purple-400/40",
    dot: "bg-purple-600",
    bgLight: "bg-purple-50/70",
  },
  // Technology & STEM -> Cyan / Sky
  technology: {
    name: "Technology",
    badge: "bg-cyan-500/10 text-cyan-800 ring-cyan-500/20 border-cyan-500/30",
    glow: "rgba(6, 182, 212, 0.25)",
    accent: "#0891b2",
    border: "border-cyan-400/40",
    dot: "bg-cyan-600",
    bgLight: "bg-cyan-50/70",
  },
  // Sustainability & Campus Life -> Green / Emerald
  sustainability: {
    name: "Sustainability",
    badge: "bg-emerald-500/10 text-emerald-800 ring-emerald-500/20 border-emerald-500/30",
    glow: "rgba(16, 185, 129, 0.25)",
    accent: "#059669",
    border: "border-emerald-400/40",
    dot: "bg-emerald-600",
    bgLight: "bg-emerald-50/70",
  },
  // Holidays & Celebrations -> Golden Amber
  celebrations: {
    name: "Celebrations & Holidays",
    badge: "bg-amber-500/12 text-amber-800 ring-amber-500/25 border-amber-500/30",
    glow: "rgba(217, 119, 6, 0.25)",
    accent: "#d97706",
    border: "border-amber-400/40",
    dot: "bg-amber-600",
    bgLight: "bg-amber-50/70",
  },
  // Student Initiatives & Leadership -> Deep Navy / Orange Accent
  "student-initiatives": {
    name: "Leadership & Council",
    badge: "bg-orange-500/12 text-orange-800 ring-orange-500/25 border-orange-500/30",
    glow: "rgba(234, 88, 12, 0.25)",
    accent: "#ea580c",
    border: "border-orange-400/40",
    dot: "bg-orange-600",
    bgLight: "bg-orange-50/70",
  },
};

const fallback: CategoryTheme = {
  name: "Campus",
  badge: "bg-navy/8 text-navy ring-navy/15 border-navy/20",
  glow: "rgba(20, 27, 56, 0.18)",
  accent: "#1f2a44",
  border: "border-navy/20",
  dot: "bg-navy",
  bgLight: "bg-navy/5",
};

export function categoryStyle(slug: string | undefined): CategoryTheme {
  if (!slug) return fallback;
  return styles[slug.toLowerCase()] ?? fallback;
}
