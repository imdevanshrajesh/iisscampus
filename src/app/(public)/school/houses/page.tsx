import type { Metadata } from "next";
import { HousePointsPage } from "@/components/school/house-points-page";
import { getPublicHouses } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Houses · Ruby, Sapphire, Topaz, Emerald",
  description: "The official houses of IISS Boys Campus: Ruby, Sapphire, Topaz, and Emerald with faculty incharges, captains, and vice captains.",
  alternates: { canonical: "/school/houses" },
};

export default async function Page() {
  const houses = await getPublicHouses();
  return <HousePointsPage houses={houses} />;
}
