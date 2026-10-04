import { formatEventDate, pairCouncilMembers, paragraphs } from "@/lib/data/catalog";
import { classifyMediaUrl } from "@/lib/media/url";
import type { CouncilKind, CouncilMember, CouncilYear } from "@/lib/types";

const kindLabel: Record<CouncilKind, string> = {
  current: "This year",
  upcoming: "Coming up",
  past: "Earlier",
};

export function councilKindLabel(kind: CouncilKind) {
  return kindLabel[kind];
}

function CouncilSeat({ member, hosts }: { member: CouncilMember; hosts: readonly string[] }) {
  const portrait = member.imageUrl ? classifyMediaUrl(member.imageUrl, hosts) : null;
  return (
    <div className="flex items-center gap-3 px-1 py-3 md:px-4">
      {portrait?.ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={portrait.url} alt={member.imageAlt ?? ""} className="h-10 w-10 rounded-full object-cover" />
      ) : null}
      <div>
        <p className="text-sm text-muted">{member.role}</p>
        <p className="font-medium text-ink">{member.name}</p>
      </div>
    </div>
  );
}

export function CouncilYearBlock({
  year,
  hosts,
}: {
  year: CouncilYear;
  hosts: readonly string[];
}) {
  const photos = year.photos.filter((photo) => classifyMediaUrl(photo.url, hosts).ok);
  const members = year.members ?? [];

  return (
    <article id={year.slug} className="border-t border-line py-12">
      <h2 className="font-display text-4xl text-ink md:text-5xl">{year.label}</h2>
      {year.summary ? <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{year.summary}</p> : null}

      {members.length ? (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {pairCouncilMembers(members).map((pair) => (
            <li key={pair.lead.id} className="grid md:grid-cols-2">
              <CouncilSeat member={pair.lead} hosts={hosts} />
              {pair.deputy ? <CouncilSeat member={pair.deputy} hosts={hosts} /> : <div className="hidden md:block" />}
            </li>
          ))}
        </ul>
      ) : null}

      {photos.length ? (
        <ul className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {photos.map((photo) => (
            <li key={photo.id} className="mb-4 break-inside-avoid">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.alt} className="w-full rounded-2xl object-cover" loading="lazy" />
              {photo.caption ? <p className="mt-2 text-sm text-muted">{photo.caption}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {year.posts.length ? (
        <div className="mt-10 grid gap-10">
          {year.posts.map((post) => {
            const image = post.imageUrl ? classifyMediaUrl(post.imageUrl, hosts) : null;
            const date = formatEventDate(post.publishedOn);
            return (
              <article key={post.id} className="grid gap-5 border-t border-line/80 pt-8 md:grid-cols-[14rem_1fr] md:gap-10">
                <div>
                  {date ? <p className="text-sm text-muted">{date}</p> : null}
                  <h3 className="font-display mt-1 text-2xl text-ink">{post.title}</h3>
                </div>
                <div>
                  {image?.ok ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.url}
                      alt={post.imageAlt ?? ""}
                      className="mb-4 aspect-[3/2] w-full rounded-2xl object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="max-w-2xl space-y-3 text-base leading-7">
                    {paragraphs(post.body).map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
