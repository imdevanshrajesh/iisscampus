import type { Metadata } from "next";
import { FacultyPage } from "@/components/school/faculty-page";
import { getPublicCatalog, getPublicFaculty } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Faculty",
  description:
    "Meet the Principal, Vice Principals, Headmistress, Headmaster, and Supervisors leading International Indian School Sharjah (Boys).",
  alternates: { canonical: "/school/faculty" },
};

export default async function SchoolFacultyPage() {
  const [catalog, faculty] = await Promise.all([
    getPublicCatalog(),
    getPublicFaculty(),
  ]);

  return <FacultyPage items={faculty.items} hosts={catalog.mediaHosts} />;
}
