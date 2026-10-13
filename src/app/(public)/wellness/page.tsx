import type { Metadata } from "next";
import {
  getPublicWellnessCategories,
  getPublicWellnessItems,
  getWellnessPageSettings,
} from "@/lib/data/queries";
import { classifyNavigationUrl } from "@/lib/media/url";
import type { WellnessCategory, WellnessItem } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getWellnessPageSettings();
  return {
    title: settings.pageTitle,
    description: `${settings.pageTitle} — tips, posters, and resources from campus.`,
    alternates: { canonical: "/wellness" },
  };
}

const imageClass: Record<WellnessItem["imageOrientation"], string> = {
  auto: "h-auto w-full object-contain",
  portrait: "aspect-[3/4] w-full object-cover",
  landscape: "aspect-[16/10] w-full object-cover",
  square: "aspect-square w-full object-cover",
};

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
        <div className="mt-12 space-y-16">
          {groups.map((group) => (
            <section key={group.category.id} className="space-y-6">
              <h2 className="font-display text-3xl text-ink md:text-4xl">{group.category.name}</h2>
              <div className="flex flex-wrap gap-6">
                {group.items.map((item) => {
                  const pdf = item.pdfUrl ? classifyNavigationUrl(item.pdfUrl) : null;
                  return (
                    <article
                      key={item.id}
                      className="flex w-full flex-col gap-3 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.imageAlt || item.title}
                          className={`rounded-2xl border border-line ${imageClass[item.imageOrientation]}`}
                        />
                      ) : null}
                      <h3 className="text-lg font-medium text-ink">{item.title}</h3>
                      {item.body ? (
                        <div className="text-sm leading-7 text-muted whitespace-pre-wrap">{item.body}</div>
                      ) : null}
                      {pdf?.ok ? (
                        <a
                          href={pdf.url}
                          className="mt-auto inline-flex w-fit rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          Download PDF
                        </a>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">Nothing has been published here yet.</p>
      )}
    </div>
  );
}
