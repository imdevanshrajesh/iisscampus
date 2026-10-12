import Link from "next/link";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { isCouncilStaffRole, pairCouncilMembers } from "@/lib/data/catalog";
import { classifyMediaUrl } from "@/lib/media/url";
import type { CouncilBoard, CouncilMember } from "@/lib/types";

export function CouncilBoardSection({
  title,
  members,
  hosts,
  yearSlug,
  board,
}: {
  title: string;
  members: CouncilMember[];
  hosts: readonly string[];
  yearSlug: string;
  board: CouncilBoard;
}) {
  const staff = members
    .filter((member) => isCouncilStaffRole(member.role))
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const pairs = pairCouncilMembers(members);
  // Junior cards stay on this page only; profile routes are for the main board.
  const linkProfiles = board === "main";

  if (!staff.length && !pairs.length) return null;

  return (
    <div className={board === "junior" ? "mt-14 border-t border-line pt-10" : "mt-8"}>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{title}</p>

      {staff.length ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((person) => (
            <div key={person.id} className="council-member-card">
              <MemberFace member={person} hosts={hosts} yearSlug={yearSlug} linkProfiles={linkProfiles} />
            </div>
          ))}
        </div>
      ) : null}

      {pairs.length ? (
        <div className={staff.length ? "mt-8" : "mt-3"}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pairs.map(({ lead, deputy }, index) => (
              <RevealOnScroll key={lead.id} delay={80 + index * 50}>
                <div className="council-member-card">
                  <MemberFace member={lead} hosts={hosts} yearSlug={yearSlug} linkProfiles={linkProfiles} />
                  {deputy ? (
                    <div className="mt-4 border-t border-line/60 pt-4">
                      <MemberFace
                        member={deputy}
                        hosts={hosts}
                        yearSlug={yearSlug}
                        linkProfiles={linkProfiles}
                        compact
                      />
                    </div>
                  ) : null}
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MemberFace({
  member,
  hosts,
  yearSlug,
  linkProfiles,
  compact = false,
}: {
  member: CouncilMember;
  hosts: readonly string[];
  yearSlug: string;
  linkProfiles: boolean;
  compact?: boolean;
}) {
  const portrait = member.imageUrl ? classifyMediaUrl(member.imageUrl, hosts) : null;
  const body = (
    <>
      <div className={`${compact ? "h-12 w-12" : "h-16 w-16"} overflow-hidden rounded-xl bg-white/5`}>
        {portrait?.ok ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portrait.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-end p-2">
            <span className="font-display text-lg text-ink/30">{member.name.slice(0, 1)}</span>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">{member.role}</p>
        <p className={`council-person__name font-medium text-ink ${compact ? "text-sm" : "text-base"}`}>
          {member.name}
        </p>
      </div>
    </>
  );

  return (
    <div className="council-person">
      {linkProfiles ? (
        <Link href={`/council/${yearSlug}/${member.slug}`} className="council-person__link flex items-center gap-3">
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3">{body}</div>
      )}
      {member.quote ? (
        <>
          <p className="council-person__hint">Message</p>
          <p className="council-person__quote">
            <span>{member.quote}</span>
          </p>
        </>
      ) : null}
    </div>
  );
}
