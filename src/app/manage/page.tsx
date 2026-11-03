import Link from "next/link";
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  Users,
  Sparkles,
  Plus,
  ExternalLink,
  ArrowRight,
  Trophy,
  Megaphone,
  Radio,
  HeartHandshake,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { councilKindLabel } from "@/components/council/council-year";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { eventStatusLabel } from "@/lib/data/catalog";
import { countStaffSuggestions } from "@/lib/data/queries";
import { requireWorkspace } from "@/lib/manage/access";
import type { CampusEvent } from "@/lib/types";

function monthSeries(events: CampusEvent[]) {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const offset = 5 - index;
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date);
    return { key, label, count: 0 };
  });
  for (const event of events) {
    if (!event.eventDate) continue;
    const bucket = buckets.find((item) => event.eventDate?.startsWith(item.key));
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

function EnhancedMonthChart({
  series,
}: {
  series: { key: string; label: string; count: number }[];
}) {
  const max = Math.max(4, ...series.map((item) => item.count));
  const width = 640;
  const height = 180;
  const paddingTop = 26;
  const paddingBottom = 32;
  const paddingLeft = 36;
  const paddingRight = 16;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingLeft - paddingRight;

  const barWidth = 36;
  const totalSlots = series.length;
  const step = chartWidth / totalSlots;

  // Grid steps (0, mid, max)
  const gridSteps = [0, Math.ceil(max / 2), max];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="Events frequency by month chart"
      >
        <defs>
          <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#c2410c" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="barHover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>

        {/* Horizontal reference grid lines */}
        {gridSteps.map((val) => {
          const y = paddingTop + chartHeight - (val / max) * chartHeight;
          return (
            <g key={val}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#9ca3af"
                fontWeight="500"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {series.map((item, index) => {
          const x = paddingLeft + index * step + (step - barWidth) / 2;
          const barHeight = item.count === 0 ? 3 : (item.count / max) * chartHeight;
          const y = paddingTop + chartHeight - barHeight;

          return (
            <g key={item.key} className="group cursor-pointer">
              {/* Subtle background track */}
              <rect
                x={x}
                y={paddingTop}
                width={barWidth}
                height={chartHeight}
                rx={6}
                fill="#f3f4f6"
                opacity="0.7"
              />

              {/* Data bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={6}
                fill={item.count === 0 ? "#d1d5db" : "url(#barGlow)"}
                className="transition-all duration-200 group-hover:fill-[url(#barHover)]"
              />

              {/* Count label badge */}
              {item.count > 0 ? (
                <g>
                  <rect
                    x={x + barWidth / 2 - 11}
                    y={y - 20}
                    width={22}
                    height={16}
                    rx={4}
                    fill="#111827"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#ffffff"
                  >
                    {item.count}
                  </text>
                </g>
              ) : (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#9ca3af"
                >
                  0
                </text>
              )}

              {/* Month Label */}
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="#4b5563"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default async function ManageHomePage() {
  const [access, suggestions] = await Promise.all([
    requireWorkspace(),
    countStaffSuggestions(),
  ]);
  if (!access.ready) return <ManageUnavailable />;

  const counts = access.workspace.events.reduce(
    (summary, event) => {
      summary[event.publicationStatus] += 1;
      return summary;
    },
    { draft: 0, in_review: 0, published: 0, archived: 0 },
  );

  const totalEvents = access.workspace.events.length;
  const ongoing = access.workspace.events.filter(
    (event) => event.eventStatus === "ongoing" && event.publicationStatus === "published",
  );
  const waiting = access.workspace.events.filter((event) => event.publicationStatus === "in_review");
  const months = monthSeries(access.workspace.events);
  const suggestionCount = access.role === "administrator" ? suggestions : null;

  const totalRecent = months.reduce((acc, m) => acc + m.count, 0);

  const statusRows = [
    { label: "Published", value: counts.published, color: "bg-emerald-500", text: "text-emerald-700" },
    { label: "In Review", value: counts.in_review, color: "bg-amber-500", text: "text-amber-700" },
    { label: "Drafts", value: counts.draft, color: "bg-slate-400", text: "text-slate-600" },
    { label: "Archived", value: counts.archived, color: "bg-gray-300", text: "text-gray-500" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted border border-gray-200">
              {access.role} Desk
            </span>
            <span className="text-xs text-muted">India International School Campus</span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Management Overview
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/manage/ai"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-xs"
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Content Agent</span>
          </Link>
          <Link
            href="/manage/events/new"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Event</span>
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-muted hover:text-ink transition-colors shadow-xs"
            title="Preview Live Site"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* AI Copilot Quick Callout Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-200/90 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/60 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 max-w-2xl">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-xs">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-950 text-sm sm:text-base">
                  Grok Content Assistant is Ready
                </h3>
                <span className="rounded-full bg-orange-200/80 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-orange-800">
                  xAI Agent
                </span>
              </div>
              <p className="text-xs text-gray-700 mt-0.5">
                Send raw bullet points, WhatsApp messages, or emails. Grok auto-generates full descriptions, dates, categories, and identifies missing photo uploads for 1-click publishing.
              </p>
            </div>
          </div>

          <Link
            href="/manage/ai"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors shadow-xs shrink-0"
          >
            <span>Launch AI Agent</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Stat Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Link
          href="/events?status=ongoing"
          className="group rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-orange-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">On Now</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{ongoing.length}</p>
          <p className="mt-1 text-[11px] text-muted">Currently active events</p>
        </Link>

        <Link
          href="/manage/events?status=published"
          className="group rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-orange-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Published</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{counts.published}</p>
          <p className="mt-1 text-[11px] text-muted">Live on school portal</p>
        </Link>

        <Link
          href="/manage/events?status=in_review"
          className="group rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-orange-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">In Review</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{counts.in_review}</p>
          <p className="mt-1 text-[11px] text-muted">Awaiting approval</p>
        </Link>

        <Link
          href="/manage/events?status=draft"
          className="group rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-orange-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Drafts</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{counts.draft}</p>
          <p className="mt-1 text-[11px] text-muted">Unpublished drafts</p>
        </Link>

        <Link
          href="/manage/council"
          className="group rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-orange-300 hover:shadow-sm transition-all sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Council</span>
            <Users className="h-4 w-4 text-navy" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">
            {access.workspace.councilYears.length}
          </p>
          <p className="mt-1 text-[11px] text-muted">Council terms stored</p>
        </Link>
      </div>

      {/* Main Analytics: Events Frequency Graph + Publication Breakdown */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Events Frequency Graph */}
        <section className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-xs lg:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 tracking-tight">
                  Events Activity (Past 6 Months)
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  Total of {totalRecent} events organized across the last 6 months.
                </p>
              </div>
              <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-700">
                Monthly Breakdown
              </span>
            </div>
            <div className="mt-4">
              <EnhancedMonthChart series={months} />
            </div>
          </div>
        </section>

        {/* Content Status Breakdown */}
        <section className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 tracking-tight">
                Publication Health
              </h2>
              <span className="text-xs text-muted font-medium">{totalEvents} total</span>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {counts.published} of {totalEvents} events are currently published live.
            </p>

            {/* Segmented multi-color progress bar */}
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-gray-100 p-0.5">
              {statusRows.map((row) => {
                const pct = totalEvents > 0 ? (row.value / totalEvents) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={row.label}
                    style={{ width: `${pct}%` }}
                    className={`h-full ${row.color} first:rounded-l-full last:rounded-r-full transition-all duration-300`}
                    title={`${row.label}: ${row.value}`}
                  />
                );
              })}
            </div>

            {/* Status Breakdown List */}
            <ul className="mt-5 space-y-3">
              {statusRows.map((row) => {
                const pct = totalEvents > 0 ? Math.round((row.value / totalEvents) * 100) : 0;
                return (
                  <li key={row.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                      <span className="font-medium text-gray-700">{row.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{row.value}</span>
                      <span className="text-[10px] text-muted w-8 text-right">{pct}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-3">
            <Link
              href="/manage/events"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              <span>Manage all events</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>
      </div>

      {/* Operational Grids: Live Events & Council */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Happening Now */}
        <section className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <h2 className="text-sm font-semibold text-gray-900">Happening Now</h2>
            </div>
            <Link
              href="/manage/events/new"
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              + New event
            </Link>
          </div>

          {ongoing.length ? (
            <ul className="divide-y divide-gray-100">
              {ongoing.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 py-3 text-xs">
                  <div>
                    <Link
                      href={`/manage/events/${event.id}/edit`}
                      className="font-medium text-gray-900 hover:text-orange-600 transition-colors"
                    >
                      {event.title}
                    </Link>
                    <p className="text-[11px] text-muted">
                      {eventStatusLabel(event.eventStatus)} · {event.eventDate}
                    </p>
                  </div>
                  <a
                    href={`/events/${event.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200"
                  >
                    <span>View</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center">
              <p className="text-xs text-muted">No published events are currently marked as ongoing.</p>
              <p className="mt-1 text-[11px] text-muted">
                Set status to ongoing on an event when it begins to highlight it live on the homepage.
              </p>
            </div>
          )}

          {waiting.length > 0 && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900 flex items-center justify-between">
              <span>{waiting.length} event{waiting.length === 1 ? "" : "s"} waiting in review.</span>
              <Link
                href="/manage/events?status=in_review"
                className="font-semibold underline hover:text-amber-950"
              >
                Review now
              </Link>
            </div>
          )}
        </section>

        {/* Student Council */}
        <section className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              <h2 className="text-sm font-semibold text-gray-900">Student Council</h2>
            </div>
            <Link
              href="/manage/council/new"
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              + New year
            </Link>
          </div>

          {access.workspace.councilYears.length ? (
            <ul className="divide-y divide-gray-100">
              {access.workspace.councilYears.slice(0, 5).map((year) => (
                <li key={year.id} className="flex items-center justify-between gap-3 py-3 text-xs">
                  <div>
                    <Link
                      href={`/manage/council/${year.id}/edit`}
                      className="font-medium text-gray-900 hover:text-orange-600 transition-colors"
                    >
                      {year.label} Council
                    </Link>
                    <p className="text-[11px] text-muted">
                      {councilKindLabel(year.kind)} · {year.members.length} members
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                      {year.photos.length} photos
                    </span>
                    <Link
                      href={`/manage/council/${year.id}/edit`}
                      className="text-orange-600 hover:underline font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center">
              <p className="text-xs text-muted">No council years configured yet.</p>
            </div>
          )}
        </section>
      </div>

      {/* Quick Access Badges for other sections */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
          Quick Section Navigation
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/manage/announcements"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 font-medium text-gray-700 hover:border-orange-500 hover:text-orange-600"
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>Announcements ({access.workspace.announcements?.length ?? 0})</span>
          </Link>
          <Link
            href="/manage/achievements"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 font-medium text-gray-700 hover:border-orange-500 hover:text-orange-600"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Achievements ({access.workspace.achievements.length})</span>
          </Link>
          <Link
            href="/manage/marquee"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 font-medium text-gray-700 hover:border-orange-500 hover:text-orange-600"
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Marquee Ticker</span>
          </Link>
          <Link
            href="/manage/wellness"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 font-medium text-gray-700 hover:border-orange-500 hover:text-orange-600"
          >
            <HeartHandshake className="h-3.5 w-3.5" />
            <span>Wellness Hub</span>
          </Link>
          <Link
            href="/manage/faq"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 font-medium text-gray-700 hover:border-orange-500 hover:text-orange-600"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>FAQ ({access.workspace.faqs?.length ?? 0})</span>
          </Link>
          {suggestionCount !== null && (
            <Link
              href="/manage/suggestions"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 font-medium text-gray-700 hover:border-orange-500 hover:text-orange-600"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Suggestions ({suggestionCount})</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
