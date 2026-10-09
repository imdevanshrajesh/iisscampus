import Link from "next/link";
import { paragraphs } from "@/lib/data/catalog";
import { classifyMediaUrl } from "@/lib/media/url";
import type { CouncilMember, CouncilYear } from "@/lib/types";

function Prose({ title, text }: { title: string; text: string }) {
  const blocks = paragraphs(text);
  return (
    <section>
      <h2 className="profile-name font-display text-3xl text-ink md:text-4xl">{title}</h2>
      <div className="profile-note max-w-xl space-y-4 text-base leading-7 text-ink">
        {blocks.map((paragraph, index) => (
          <p key={`${index}-${paragraph}`}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

export function CouncilMemberView({
  year,
  member,
  hosts,
  preview = false,
}: {
  year: CouncilYear;
  member: CouncilMember;
  hosts: readonly string[];
  preview?: boolean;
}) {
  const portrait = member.imageUrl ? classifyMediaUrl(member.imageUrl, hosts) : null;

  return (
    <article className="mx-auto max-w-[90rem] px-5 py-8 md:px-8 md:py-14">
      {preview ? (
        <p className="mb-8 rounded-2xl border border-line bg-wash px-4 py-3 text-sm text-ink">
          This preview is not on the public site.
        </p>
      ) : null}
      <Link href={`/council#${year.slug}`} className="text-sm text-muted hover:text-ink">
        {year.label}
      </Link>
      <div className="mt-10 flex flex-col items-start gap-8 md:flex-row md:items-center md:gap-14">
        <div className="w-full max-w-[16rem] shrink-0 overflow-hidden rounded-[1.75rem] bg-white/5">
          {portrait?.ok ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portrait.url} alt={member.imageAlt ?? ""} className="profile-portrait" />
          ) : (
            <div className="profile-portrait flex items-center bg-white/5 p-6">
              <span className="profile-name font-display text-7xl leading-none text-ink/25">{member.name.slice(0, 1)}</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-medium tracking-[0.16em] text-accent uppercase md:text-xl">{member.role}</p>
          <h1 className="profile-name font-display mt-3 text-[clamp(3.2rem,6vw,6rem)] leading-[0.86] text-ink">
            {member.name}
          </h1>
        </div>
      </div>
      {member.quote ? (
        <blockquote className="profile-name font-display mt-10 max-w-xl text-2xl leading-snug text-gold italic">
          {member.quote}
        </blockquote>
      ) : null}
      <div className="mt-20 grid gap-12 border-t border-line pt-16 md:grid-cols-2 md:gap-16 md:pt-20">
        <Prose title="About me" text={member.about ?? ""} />
        <Prose title="What I do" text={member.work ?? ""} />
      </div>
    </article>
  );
}
