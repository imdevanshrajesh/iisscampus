import type { Metadata } from "next";
import { CouncilPageView } from "@/components/council/council-page";
import { selectPublicCouncil } from "@/lib/data/catalog";
import { getPublicCatalog, getPublicSocial } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Student Council · Boys",
  description: "Photographs and notes from the boys' student council, year by year.",
  alternates: { canonical: "/council" },
};

export default async function CouncilPage() {
  const [catalog, social] = await Promise.all([getPublicCatalog(), getPublicSocial()]);
  const years = selectPublicCouncil(catalog.councilYears);

  return <CouncilPageView years={years} hosts={catalog.mediaHosts} scixcomUrl={social.scixcomInstagramUrl} />;
}
