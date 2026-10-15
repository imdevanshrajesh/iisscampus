import type { Metadata } from "next";
import { AnnouncementsPage } from "@/components/announcements/announcements-page";
import { getPublicAnnouncements, getPublicCatalog } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Announcements",
  description: "Campus announcements and updates for IISS x Student Council Boys.",
  alternates: { canonical: "/announcements" },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const params = await searchParams;
  const [announcements, catalog] = await Promise.all([getPublicAnnouncements(), getPublicCatalog()]);
  const open = typeof params.open === "string" && params.open.trim() ? params.open.trim() : null;

  return (
    <AnnouncementsPage
      announcements={announcements}
      events={catalog.events}
      initialOpenId={open}
    />
  );
}
