import { FileText, Link2, Play } from "lucide-react";
import { classifyMediaUrl, classifyNavigationUrl } from "@/lib/media/url";
import { presentVideo } from "@/lib/media/video";
import type { CampusEvent, ContentResource } from "@/lib/types";

export function PreviewExtras({ event, hosts }: { event: CampusEvent; hosts: readonly string[] }) {
  const pinned = [...event.images]
    .filter((image) => image.pinned && classifyMediaUrl(image.url, hosts).ok)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const resources = event.resources.filter((item) => item.title.trim());
  const video = presentVideo(event.videoUrl);

  if (!pinned.length && !resources.length && !event.schedule.length && !video) return null;

  return (
    <div className="mt-6 grid gap-5 border-t border-line pt-5">
      {pinned.length ? (
        <section>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Photographs</p>
          <ul className="mt-3 grid gap-3">
            {pinned.map((image) => (
              <li key={image.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.alt} className="aspect-[3/2] w-full rounded-xl object-cover" />
                {image.caption ? <p className="mt-1.5 text-xs text-muted">{image.caption}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {resources.length ? (
        <section>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Files and links</p>
          <ul className="mt-3 grid gap-2">
            {resources.map((item, index) => (
              <ResourceRow key={`${item.title}-${index}`} item={item} />
            ))}
          </ul>
        </section>
      ) : null}

      {event.schedule.length ? (
        <section>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Schedule</p>
          <ol className="mt-3 grid gap-2">
            {event.schedule.map((item) => (
              <li key={`${item.time}-${item.title}`}>
                <p className="text-xs uppercase tracking-[0.12em] text-muted">{item.time}</p>
                <p className="text-sm font-medium text-ink">{item.title}</p>
                {item.detail ? <p className="text-sm text-muted">{item.detail}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {video ? (
        <a href={video.href} className="inline-flex items-center gap-2 text-sm text-accent" rel="noopener noreferrer" target="_blank">
          <Play aria-hidden="true" size={14} />
          Watch
        </a>
      ) : null}
    </div>
  );
}

function ResourceRow({ item }: { item: ContentResource }) {
  const link = item.href ? classifyNavigationUrl(item.href) : null;
  const href = link?.ok ? link.url : null;
  const Icon = item.kind === "pdf" ? FileText : Link2;
  const label = item.kind === "pdf" ? "PDF" : item.kind === "link" ? "Link" : "Note";
  const body = (
    <>
      <Icon aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-accent" />
      <span>
        <span className="block text-[0.65rem] uppercase tracking-[0.12em] text-muted">{label}</span>
        <span className="mt-0.5 block text-sm font-medium text-ink">{item.title}</span>
        {item.detail ? <span className="mt-1 block text-sm text-muted">{item.detail}</span> : null}
      </span>
    </>
  );

  if (!href) {
    return <li className="flex gap-3 rounded-xl border border-line px-3 py-2.5">{body}</li>;
  }

  return (
    <li>
      <a
        href={href}
        className="flex gap-3 rounded-xl border border-line px-3 py-2.5 hover:border-accent/40"
        rel="noopener noreferrer"
        target="_blank"
      >
        {body}
      </a>
    </li>
  );
}
