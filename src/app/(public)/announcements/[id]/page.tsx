import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  HeartPulse,
  FileText,
  ArrowRight,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { ResourceCards } from "@/components/content/resource-cards";
import { NoticeShareButton } from "@/components/announcements/notice-share-button";
import { formatAnnouncementDate, renderAnnouncementMessage } from "@/lib/announcements";
import {
  getPublicAnnouncements,
  getPublicCatalog,
  getPublicCustomPrograms,
  getPublicWellnessItems,
} from "@/lib/data/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const announcements = await getPublicAnnouncements();
  const notice = announcements.find((item) => item.id === id);

  if (!notice) {
    return {
      title: "Notice Not Found",
    };
  }

  const description = notice.body.trim()
    ? notice.body.slice(0, 160).replace(/\s+/g, " ")
    : "Official circular & directive from the IISS Student Council.";

  return {
    title: notice.title,
    description,
    alternates: { canonical: `/announcements/${notice.id}` },
    openGraph: {
      title: notice.title,
      description,
      images: notice.coverImageUrl ? [notice.coverImageUrl] : undefined,
    },
  };
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [announcements, catalog, programs, wellnessItems] = await Promise.all([
    getPublicAnnouncements(),
    getPublicCatalog(),
    getPublicCustomPrograms(),
    getPublicWellnessItems(),
  ]);

  const notice = announcements.find((item) => item.id === id);
  if (!notice) {
    notFound();
  }

  const linkedEvent = notice.eventId
    ? catalog.events.find((e) => e.id === notice.eventId)
    : null;
  const linkedProgram = notice.programId
    ? programs.find((p) => p.id === notice.programId)
    : null;
  const linkedWellness = notice.wellnessId
    ? wellnessItems.find((w) => w.id === notice.wellnessId)
    : null;
  const date = formatAnnouncementDate(notice.createdAt);

  return (
    <article className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-16">
      {/* Back button */}
      <div className="mb-8">
        <Link
          href="/announcements"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to all notices</span>
        </Link>
      </div>

      {/* Header Badges & Date */}
      <div className="space-y-4 border-b border-line/80 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-navy px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
              {notice.category || "Campus Directive"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
              <ShieldCheck size={12} /> Official Bulletin
            </span>
          </div>

          {date ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <Calendar size={13} />
              {date}
            </span>
          ) : null}
        </div>

        <h1 className="font-display text-[clamp(2.2rem,4.5vw,3.8rem)] leading-[1.05] text-ink">
          {notice.title}
        </h1>

        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Sanctioned by</span>
          <span className="font-semibold text-ink">Student Council Executive &amp; Campus Administration</span>
        </div>
      </div>

      {/* Cover Image Banner */}
      {notice.coverImageUrl ? (
        <div className="my-8 overflow-hidden rounded-2xl border border-line shadow-md aspect-[16/9] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={notice.coverImageUrl}
            alt={notice.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      {/* Article Body Content */}
      <div className="my-8 space-y-5 text-base sm:text-lg leading-relaxed text-ink/90">
        {notice.body ? (
          <div className="space-y-4 leading-relaxed">
            {renderAnnouncementMessage(notice.body)}
          </div>
        ) : (
          <p className="text-muted italic">No additional text provided for this circular.</p>
        )}
      </div>

      {/* Linked Resources & Associations */}
      <div className="space-y-4 pt-4 border-t border-line/80">
        {/* Linked Program / Activity */}
        {linkedProgram ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                <Sparkles size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Related Campus Activity
                </span>
                <h3 className="font-display text-lg font-medium text-emerald-950 mt-0.5">
                  {linkedProgram.title}
                </h3>
                {linkedProgram.summary ? (
                  <p className="text-xs text-emerald-800/90 mt-1 line-clamp-2">
                    {linkedProgram.summary}
                  </p>
                ) : null}
              </div>
            </div>

            <Link
              href="/school/programs"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shrink-0"
            >
              <span>Explore Activity</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : null}

        {/* Linked Wellness */}
        {linkedWellness ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shrink-0 mt-0.5">
                <HeartPulse size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                  Related Wellness Guide
                </span>
                <h3 className="font-display text-lg font-medium text-sky-950 mt-0.5">
                  {linkedWellness.title}
                </h3>
              </div>
            </div>

            <Link
              href="/wellness"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 transition shrink-0"
            >
              <span>Visit Wellness</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : null}

        {/* Linked Event */}
        {linkedEvent ? (
          <div className="rounded-2xl border border-line bg-wash/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-white shrink-0 mt-0.5">
                <FileText size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Associated Event
                </span>
                <h3 className="font-display text-lg font-medium text-ink mt-0.5">
                  {linkedEvent.title}
                </h3>
                {linkedEvent.shortDescription ? (
                  <p className="text-xs text-muted mt-1 line-clamp-2">
                    {linkedEvent.shortDescription}
                  </p>
                ) : null}
              </div>
            </div>

            <Link
              href={`/events/${linkedEvent.slug}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy/90 transition shrink-0"
            >
              <span>View Event Details</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : null}

        {/* Attached PDF Documents & Resources */}
        {notice.resources.length > 0 ? (
          <div className="pt-4">
            <ResourceCards resources={notice.resources} title="Official Directives & PDF Downloads" />
          </div>
        ) : null}
      </div>

      {/* Share and Navigation Bar */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line/80 pt-6">
        <div className="flex items-center gap-3">
          <NoticeShareButton title={notice.title} noticeId={notice.id} />
        </div>

        <Link
          href="/announcements"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
        >
          <span>All Campus Notices &amp; Bulletins</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
}
