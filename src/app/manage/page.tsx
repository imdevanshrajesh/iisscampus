import Link from "next/link";
import { councilKindLabel } from "@/components/council/council-year";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { eventStatusLabel } from "@/lib/data/catalog";
import { requireWorkspace } from "@/lib/manage/access";

export default async function ManageHomePage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  const counts = access.workspace.events.reduce(
    (summary, event) => {
      summary[event.publicationStatus] += 1;
      return summary;
    },
    { draft: 0, in_review: 0, published: 0, archived: 0 },
  );
  const ongoing = access.workspace.events.filter(
    (event) => event.eventStatus === "ongoing" && event.publicationStatus === "published",
  );
  const waiting = access.workspace.events.filter((event) => event.publicationStatus === "in_review");

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{access.role}</p>
      <h1 className="font-display mt-2 text-4xl text-ink">Content desk</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        Events, the boys&apos; student council, and achievements. Publish only what should be on the public site.
      </p>

      <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["On now", ongoing.length, "/events?status=ongoing"],
            ["In review", counts.in_review, "/manage/events?status=in_review"],
            ["Drafts", counts.draft, "/manage/events?status=draft"],
            ["Council years", access.workspace.councilYears.length, "/manage/council"],
          ] as const
        ).map(([label, value, href]) => (
          <Link key={label} href={href} className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_0_rgba(20,27,56,0.04)]">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-2 text-3xl font-medium">{value}</dd>
          </Link>
        ))}
      </dl>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_0_rgba(20,27,56,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium">Happening now</h2>
            <Link href="/manage/events/new" className="text-sm text-accent">
              New event
            </Link>
          </div>
          {ongoing.length ? (
            <ul className="mt-4 divide-y divide-line">
              {ongoing.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/manage/events/${event.id}/edit`} className="font-medium">
                      {event.title}
                    </Link>
                    <p className="text-sm text-muted">{eventStatusLabel(event.eventStatus)}</p>
                  </div>
                  <a
                    href={`/events/${event.slug}`}
                    className="text-sm text-accent"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">
              No published event is marked as ongoing. Set that status on an event when it is actually happening.
            </p>
          )}
          {waiting.length ? (
            <p className="mt-4 text-sm text-muted">{waiting.length} event{waiting.length === 1 ? "" : "s"} waiting in review.</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_0_rgba(20,27,56,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium">Student council · Boys</h2>
            <Link href="/manage/council/new" className="text-sm text-accent">
              New year
            </Link>
          </div>
          {access.workspace.councilYears.length ? (
            <ul className="mt-4 divide-y divide-line">
              {access.workspace.councilYears.slice(0, 6).map((year) => (
                <li key={year.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/manage/council/${year.id}/edit`} className="font-medium">
                      {year.label}
                    </Link>
                    <p className="text-sm text-muted">
                      {councilKindLabel(year.kind)} · {year.publicationStatus.replace("_", " ")}
                    </p>
                  </div>
                  <span className="text-sm text-muted">
                    {year.photos.length} photos
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">
              Add the current council year, then later years as they come. Each year holds its own photographs and posts.
            </p>
          )}
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/manage/events" className="text-ink">
          All events · {counts.published} published
        </Link>
        <Link href="/manage/achievements" className="text-ink">
          Achievements · {access.workspace.achievements.length}
        </Link>
        <Link href="/manage/gallery" className="text-ink">
          Gallery
        </Link>
      </div>
    </div>
  );
}