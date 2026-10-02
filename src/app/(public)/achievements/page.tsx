import type { Metadata } from "next";
import Link from "next/link";
import { MediaFrame } from "@/components/media/media-frame";
import { categoryById, formatEventDate } from "@/lib/data/catalog";
import { getPublicCatalog } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Achievements",
  description: "Published competition results and campus achievements.",
  alternates: { canonical: "/achievements" },
};

export default async function AchievementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const catalog = await getPublicCatalog();
  const year = first(params.year);
  const category = first(params.category);
  const categoryMatch = catalog.categories.find((item) => item.slug === category);
  const years = [
    ...new Set(
      catalog.achievements
        .map((item) => item.eventDate?.slice(0, 4) || item.academicYear)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const visible = catalog.achievements.filter((item) => {
    if (categoryMatch && item.categoryId !== categoryMatch.id) return false;
    if (year) {
      const itemYear = item.eventDate?.slice(0, 4) || item.academicYear;
      if (itemYear !== year) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Record</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">Achievements</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted">
        Named results are shown only when they have been approved for publication.
      </p>
      <form method="get" className="mt-8 flex flex-wrap gap-4" action="/achievements">
        <label className="grid gap-1.5 text-sm">
          Category
          <select name="category" defaultValue={category ?? ""} className="rounded-md border border-line bg-white px-3 py-2">
            <option value="">All</option>
            {catalog.categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {years.length ? (
          <label className="grid gap-1.5 text-sm">
            Year
            <select name="year" defaultValue={year ?? ""} className="rounded-md border border-line bg-white px-3 py-2">
              <option value="">All</option>
              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button type="submit" className="self-end rounded-md bg-ink px-4 py-2 text-sm text-white">
          Apply
        </button>
      </form>

      {visible.length ? (
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {visible.map((item) => {
            const itemCategory = categoryById(catalog.categories, item.categoryId ?? "");
            const related = catalog.events.find((event) => event.id === item.eventId);
            return (
              <li key={item.id} className="overflow-hidden rounded-xl border border-line">
                <MediaFrame
                  url={item.imageUrl}
                  alt={item.imageAlt}
                  hosts={catalog.mediaHosts}
                  title={item.title}
                  kicker={itemCategory?.name ?? "Achievement"}
                />
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">
                    {[item.competitionName, formatEventDate(item.eventDate), item.academicYear]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <h2 className="mt-2 text-xl font-medium tracking-tight">{item.title}</h2>
                  {item.winnerName || item.award ? (
                    <p className="mt-2 text-sm text-muted">
                      {[item.award, item.winnerName].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  {related ? (
                    <Link href={`/events/${related.slug}`} className="mt-4 inline-flex text-sm text-accent">
                      Related event
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-10 rounded-xl border border-line px-6 py-12">
          <p className="text-lg font-medium">No published achievements yet.</p>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
            Results, winners, and awards will be listed here after an administrator publishes them. Personal names are not shown unless they are part of an approved record.
          </p>
        </div>
      )}
    </div>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
