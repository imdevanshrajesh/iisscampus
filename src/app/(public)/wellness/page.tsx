import type { Metadata } from "next";
import { WellnessBoard } from "@/components/wellness/wellness-board";
import {
  getPublicWellnessCategories,
  getPublicWellnessItems,
  getWellnessPageSettings,
} from "@/lib/data/queries";
import type { WellnessCategory, WellnessItem } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getWellnessPageSettings();
  return {
    title: settings.pageTitle,
    description: `${settings.pageTitle} — tips, posters, and resources from campus.`,
    alternates: { canonical: "/wellness" },
  };
}

function groupByCategory(categories: WellnessCategory[], items: WellnessItem[]) {
  const groups = categories
    .map((category) => ({
      category,
      items: items.filter((item) => item.categoryId === category.id),
    }))
    .filter((group) => group.items.length > 0);

  const uncategorized = items.filter(
    (item) => !item.categoryId || !categories.some((category) => category.id === item.categoryId),
  );
  if (uncategorized.length) {
    groups.push({
      category: { id: "__uncategorized", name: "More", sortOrder: Number.MAX_SAFE_INTEGER },
      items: uncategorized,
    });
  }
  return groups;
}

export default async function WellnessPage() {
  const [settings, categories, items] = await Promise.all([
    getWellnessPageSettings(),
    getPublicWellnessCategories(),
    getPublicWellnessItems(),
  ]);
  const groups = groupByCategory(categories, items);

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-12 md:px-8 md:py-16">
      <p className="kicker text-accent">Campus</p>
      <h1 className="font-display mt-3 text-5xl text-ink md:text-6xl">{settings.pageTitle}</h1>

      {groups.length ? (
        <WellnessBoard groups={groups} />
      ) : (
        <p className="mt-8 text-sm text-muted">Nothing has been published here yet.</p>
      )}
    </div>
  );
}
