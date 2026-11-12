import type { FacultyMember, FacultyTier } from "@/lib/types";

export type FacultyTierMeta = {
  tier: FacultyTier;
  label: string;
  singularLabel: string;
  defaultRole: string;
  sectionTitle: string;
  sectionSubtitle: string;
};

export const FACULTY_TIER_META: readonly FacultyTierMeta[] = [
  {
    tier: "principal",
    label: "Principal",
    singularLabel: "Principal",
    defaultRole: "Principal",
    sectionTitle: "Office of the Principal",
    sectionSubtitle: "Guiding vision and message to the school community",
  },
  {
    tier: "vice_principal",
    label: "Vice Principals",
    singularLabel: "Vice Principal",
    defaultRole: "Vice Principal",
    sectionTitle: "Vice Principals",
    sectionSubtitle: "Academic and campus administration",
  },
  {
    tier: "head",
    label: "Headmistress & Headmaster",
    singularLabel: "Headmistress / Headmaster",
    defaultRole: "Headmistress",
    sectionTitle: "Headmistress & Headmaster",
    sectionSubtitle: "Section leadership and academic oversight",
  },
  {
    tier: "supervisor",
    label: "Supervisors",
    singularLabel: "Supervisor",
    defaultRole: "Supervisor",
    sectionTitle: "Supervisors",
    sectionSubtitle: "Student coordination and daily campus supervision",
  },
];

export const FACULTY_TIER_MAP: Record<FacultyTier, FacultyTierMeta> = {
  principal: FACULTY_TIER_META[0],
  vice_principal: FACULTY_TIER_META[1],
  head: FACULTY_TIER_META[2],
  supervisor: FACULTY_TIER_META[3],
};

export function normalizeFacultyTier(value: unknown): FacultyTier {
  const raw = String(value ?? "supervisor").toLowerCase().trim();
  if (raw === "principal" || raw === "vice_principal" || raw === "head" || raw === "supervisor") {
    return raw;
  }
  return "supervisor";
}

export function mapFacultyMemberRow(row: Record<string, unknown>): FacultyMember {
  const photoRaw = row.photo_url ?? row.photoUrl;
  const emailRaw = row.email;

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    role: String(row.role ?? ""),
    tier: normalizeFacultyTier(row.tier),
    department: row.department ? String(row.department).trim() || null : null,
    photoUrl: photoRaw ? String(photoRaw).trim() || null : null,
    message: String(row.message ?? ""),
    email: emailRaw ? String(emailRaw).trim() || null : null,
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0) || 0,
    published: Boolean(row.published ?? true),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString()),
  };
}

export function groupFacultyByTier(items: FacultyMember[]) {
  const byTier: Record<FacultyTier, FacultyMember[]> = {
    principal: [],
    vice_principal: [],
    head: [],
    supervisor: [],
  };

  for (const member of items) {
    byTier[member.tier].push(member);
  }

  for (const tier of Object.keys(byTier) as FacultyTier[]) {
    byTier[tier].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
  }

  return byTier;
}
