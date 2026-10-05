const styles: Record<string, { tag: string; glow: string }> = {
  cultural: { tag: "bg-[#1f2a44]/8 text-[#1f2a44] ring-[#1f2a44]/15", glow: "rgba(31, 42, 68, 0.16)" },
  sports: { tag: "bg-[#c65a12]/10 text-[#9a4310] ring-[#c65a12]/20", glow: "rgba(198, 90, 18, 0.2)" },
  academic: { tag: "bg-[#1f2a44]/8 text-[#1f2a44] ring-[#1f2a44]/15", glow: "rgba(31, 42, 68, 0.16)" },
  technology: { tag: "bg-[#6a6258]/10 text-[#4e4840] ring-[#6a6258]/20", glow: "rgba(106, 98, 88, 0.18)" },
  sustainability: { tag: "bg-[#5c6b45]/10 text-[#3f4a30] ring-[#5c6b45]/20", glow: "rgba(92, 107, 69, 0.18)" },
  "student-initiatives": { tag: "bg-[#c65a12]/12 text-[#9a4310] ring-[#c65a12]/25", glow: "rgba(198, 90, 18, 0.22)" },
  celebrations: { tag: "bg-[#8a5a32]/10 text-[#6b4224] ring-[#8a5a32]/20", glow: "rgba(138, 90, 50, 0.18)" },
};

const fallback = {
  tag: "bg-navy/8 text-navy ring-navy/15",
  glow: "rgba(20, 27, 56, 0.18)",
};

export function categoryStyle(slug: string | undefined) {
  if (!slug) return fallback;
  return styles[slug] ?? fallback;
}
