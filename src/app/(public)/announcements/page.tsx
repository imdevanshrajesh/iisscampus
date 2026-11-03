import type { Metadata } from "next";
import { AnnouncementsPage } from "@/components/announcements/announcements-page";
import {
  getPublicAnnouncements,
  getPublicCatalog,
  getPublicCustomPrograms,
  getPublicWellnessItems,
} from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Notices & Posts",
  description: "Official campus circulars, directives, safety policies, and student blog posts for IISS x Student Council Boys.",
  alternates: { canonical: "/announcements" },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const params = await searchParams;
  const [announcements, catalog, programs, wellnessItems] = await Promise.all([
    getPublicAnnouncements(),
    getPublicCatalog(),
    getPublicCustomPrograms(),
    getPublicWellnessItems(),
  ]);
  const open = typeof params.open === "string" && params.open.trim() ? params.open.trim() : null;

  return (
    <AnnouncementsPage
      announcements={announcements}
      events={catalog.events}
      programs={programs}
      wellnessItems={wellnessItems}
      initialOpenId={open}
    />
  );
}
