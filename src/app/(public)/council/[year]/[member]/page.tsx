import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CouncilMemberView } from "@/components/council/council-member-page";
import { getCampusActor } from "@/lib/auth/session";
import { findPublicCouncilMember } from "@/lib/data/catalog";
import { getPublicCatalog } from "@/lib/data/queries";
import { getStaffWorkspace } from "@/lib/data/staff";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; member: string }>;
}): Promise<Metadata> {
  const { year: yearSlug, member: memberSlug } = await params;
  const catalog = await getPublicCatalog();
  const found = findPublicCouncilMember(catalog.councilYears, yearSlug, memberSlug);
  if (!found) return { title: "Student council" };
  const description = found.member.quote ?? `${found.member.name}, ${found.member.role} for ${found.year.label}.`;
  return {
    title: `${found.member.name} · ${found.member.role}`,
    description,
    alternates: { canonical: `/council/${found.year.slug}/${found.member.slug}` },
    openGraph: {
      type: "profile",
      title: `${found.member.name} · ${found.member.role}`,
      description,
      images: found.member.imageUrl ? [found.member.imageUrl] : ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${found.member.name} · ${found.member.role}`,
      description,
      images: found.member.imageUrl ? [found.member.imageUrl] : ["/opengraph-image"],
    },
  };
}

export default async function CouncilMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ year: string; member: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { year: yearSlug, member: memberSlug } = await params;
  const query = await searchParams;
  const catalog = await getPublicCatalog();
  const found = findPublicCouncilMember(catalog.councilYears, yearSlug, memberSlug);

  if (found) {
    return <CouncilMemberView year={found.year} member={found.member} hosts={catalog.mediaHosts} />;
  }

  if (first(query.preview) === "1") {
    const actor = await getCampusActor();
    if (actor) {
      const workspace = await getStaffWorkspace();
      const draft = findPublicCouncilMember(workspace?.councilYears ?? [], yearSlug, memberSlug);
      if (draft && draft.year.publicationStatus !== "published") {
        return (
          <CouncilMemberView
            year={draft.year}
            member={draft.member}
            hosts={workspace?.mediaHosts ?? []}
            preview
          />
        );
      }
    }
  }

  notFound();
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
