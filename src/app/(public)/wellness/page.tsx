import type { Metadata } from "next";
import { getPublicWellnessItems, getWellnessPageSettings } from "@/lib/data/queries";
import { classifyNavigationUrl } from "@/lib/media/url";
import type { WellnessItem } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getWellnessPageSettings();
  return {
    title: settings.pageTitle,
    description: `${settings.pageTitle} — tips, posters, and resources from campus.`,
    alternates: { canonical: "/wellness" },
  };
}

const imageClass: Record<WellnessItem["imageOrientation"], string> = {
  auto: "h-auto w-full max-w-xl object-contain",
  portrait: "aspect-[3/4] w-full max-w-sm object-cover",
  landscape: "aspect-[16/10] w-full object-cover",
  square: "aspect-square w-full max-w-md object-cover",
};

function groupBySection(items: WellnessItem[]) {
  const groups: { section: string; items: WellnessItem[] }[] = [];
  for (const item of items) {
    const key = item.section || "";
    const existing = groups.find((group) => group.section === key);
    if (existing) existing.items.push(item);
    else groups.push({ section: key, items: [item] });
  }
  return groups;
}

export default async function WellnessPage() {
  const [settings, items] = await Promise.all([getWellnessPageSettings(), getPublicWellnessItems()]);
  const groups = groupBySection(items);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <p className="kicker text-accent">Campus</p>
      <h1 className="font-display mt-3 text-5xl text-ink md:text-6xl">{settings.pageTitle}</h1>

      {groups.length ? (
        <div className="mt-12 space-y-14">
          {groups.map((group) => (
            <section key={group.section || "__ungrouped"} className="space-y-10">
              {group.section ? (
                <h2 className="font-display text-2xl text-ink md:text-3xl">{group.section}</h2>
              ) : null}
              {group.items.map((item) => {
                const pdf = item.pdfUrl ? classifyNavigationUrl(item.pdfUrl) : null;
                return (
                  <article key={item.id} className="space-y-4">
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
                      <div className="space-y-3 text-sm leading-7 text-muted whitespace-pre-wrap">{item.body}</div>
                    ) : null}
                    {pdf?.ok ? (
                      <a
                        href={pdf.url}
                        className="inline-flex rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Download PDF
                      </a>
                    ) : null}
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">Nothing has been published here yet.</p>
      )}
    </div>
  );
}
