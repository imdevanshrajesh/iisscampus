import type { Metadata } from "next";
import { FacultyPage } from "@/components/school/faculty-page";
import { can } from "@/lib/auth/permissions";
import { getCampusActor } from "@/lib/auth/session";
import { getEditableFaculty, getPublicCatalog, getPublicFaculty } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Faculty",
  description:
    "Meet the Principal, Vice Principals, Headmistress, Headmaster, and Supervisors leading International Indian School Sharjah (Boys).",
};

export default async function SchoolFacultyPage() {
  const actor = await getCampusActor();
  const canEdit = Boolean(actor && can(actor, "manage_council"));

  const [catalog, faculty] = await Promise.all([
    getPublicCatalog(),
    canEdit ? getEditableFaculty() : getPublicFaculty(),
  ]);

  return (
    <FacultyPage
      items={faculty.items}
      hosts={catalog.mediaHosts}
      canEdit={canEdit}
      tableMissing={faculty.tableMissing}
      queryError={canEdit ? faculty.error : undefined}
    />
  );
}
