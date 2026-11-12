import Link from "next/link";
import type { Metadata } from "next";
import { MediaFrame } from "@/components/media/media-frame";
import { PreviewAchievement } from "@/components/preview/preview-provider";
import { categoryById, formatEventDate } from "@/lib/data/catalog";
import { getPublicCatalog } from "@/lib/data/queries";
import { classifyNavigationUrl } from "@/lib/media/url";
import { filterAchievementsForTerm, hasActiveTerm, normalizeTermText } from "@/lib/terms";

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
  const termConfigured = hasActiveTerm(catalog.activeTerm);
  const currentTermItems = termConfigured
    ? filterAchievementsForTerm(catalog.achievements, catalog.activeTerm)
    : catalog.achievements;
  const pastArchiveCount = Math.max(0, catalog.achievements.length - currentTermItems.length);

  const years = [
    ...new Set(
      catalog.achievements
        .map((item) => item.academicYear?.trim() || item.eventDate?.slice(0, 4))
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => b.localeCompare(a));

  const usingCurrentDefault = termConfigured && (!year || year === "current");
  const basePool = usingCurrentDefault ? currentTermItems : catalog.achievements;

  const visible = basePool.filter((item) => {
    if (categoryMatch && item.categoryId !== categoryMatch.id) return false;
    if (year && year !== "all" && year !== "current") {
      const normalizedYear = normalizeTermText(year);
      const academicMatch = normalizeTermText(item.academicYear) === normalizedYear;
      const dateMatch = Boolean(item.eventDate?.startsWith(`${year}-`));
      if (!academicMatch && !dateMatch) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <p className="text-sm text-accent">Record</p>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-5xl text-ink md:text-6xl">Achievements</h1>
        {termConfigured && catalog.activeTerm.label && usingCurrentDefault ? (
          <span className="rounded-full border border-line bg-wash/50 px-3 py-1 text-xs font-semibold text-navy">
            {catalog.activeTerm.label}
          </span>
        ) : null}
      </div>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted">
        Named results are shown only when they have been approved for publication.
      </p>
      <form method="get" className="mt-8 flex flex-wrap items-end gap-4" action="/achievements">
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
        {years.length || termConfigured ? (
          <label className="grid gap-1.5 text-sm">
            Academic Year
            <select name="year" defaultValue={year ?? (termConfigured ? "current" : "")} className="rounded-md border border-line bg-white px-3 py-2">
              {termConfigured ? (
                <>
                  <option value="current">
                    Current Term{catalog.activeTerm.label ? ` (${catalog.activeTerm.label})` : ""}
                  </option>
                  <option value="all">All Years (Archive)</option>
                </>
              ) : (
                <option value="">All</option>
              )}
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

      {usingCurrentDefault && pastArchiveCount > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-wash/35 px-4 py-2.5 text-xs text-muted">
          <span>
            Showing current term{catalog.activeTerm.label ? ` (${catalog.activeTerm.label})` : ""}.{" "}
            {pastArchiveCount} earlier {pastArchiveCount === 1 ? "result" : "results"} preserved in the archive.
          </span>
          <Link href="/achievements?year=all" className="font-semibold text-accent hover:underline">
            View archive ({pastArchiveCount})
          </Link>
        </div>
      ) : year && year !== "current" && termConfigured ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-wash/35 px-4 py-2.5 text-xs text-muted">
          <span>
            Viewing archive filter: <strong className="text-ink">{year === "all" ? "All Years" : year}</strong>
          </span>
          <Link href="/achievements" className="font-semibold text-accent hover:underline">
            Back to current term
          </Link>
        </div>
      ) : null}

      {visible.length ? (
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {visible.map((item) => {
            const itemCategory = categoryById(catalog.categories, item.categoryId ?? "");
            return (
              <li key={item.id} className="overflow-hidden rounded-xl border border-line">
                <PreviewAchievement achievement={item} className="block w-full text-left">
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
                </div>
                </PreviewAchievement>
                {item.resources.length ? (
                <div className="px-5 pb-5">
                    <div className="border-t border-line pt-4">
                      <ul className="space-y-3">
                        {item.resources.map((resource) => {
                          const link = resource.href ? classifyNavigationUrl(resource.href) : null;
                          return (
                            <li key={`${resource.title}-${resource.href ?? ""}`}>
                              <p className="text-sm font-medium">{resource.title}</p>
                              {resource.detail ? <p className="text-sm text-muted">{resource.detail}</p> : null}
                              {link?.ok ? (
                                <a
                                  href={link.url}
                                  className="mt-1 inline-flex text-sm text-accent"
                                  rel="noopener noreferrer"
                                  target="_blank"
                                >
                                  {resource.kind === "pdf" ? "Download PDF" : "Open link"}
                                </a>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                </div>
                ) : null}
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
