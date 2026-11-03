import type { Metadata } from "next";
import { AwarenessProgramsPage } from "@/components/school/awareness-programs-page";
import { getPublicCustomPrograms } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Programs & Activities",
  description: "Campus awareness campaigns, Mango Day celebration, and student activities for IISS Boys Campus.",
  alternates: { canonical: "/school/programs" },
};

export default async function Page() {
  const programs = await getPublicCustomPrograms();
  return <AwarenessProgramsPage programs={programs} />;
}
