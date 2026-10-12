"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createContext, use } from "react";
import { VenueBlock } from "@/components/events/venue-block";
import { MediaFrame } from "@/components/media/media-frame";
import { PreviewExtras } from "@/components/preview/preview-extras";
import { categoryById, eventCategoryIds, formatEventDate } from "@/lib/data/catalog";
import { classifyNavigationUrl } from "@/lib/media/url";
import { registrationState } from "@/lib/registration";
import type { Achievement, CampusEvent, Category } from "@/lib/types";

type Selection =
  | { kind: "event"; event: CampusEvent }
  | { kind: "achievement"; achievement: Achievement; related: CampusEvent | null };

type PreviewApi = {
  openEvent: (event: CampusEvent) => void;
  openAchievement: (achievement: Achievement) => void;
};

const PreviewContext = createContext<PreviewApi | null>(null);

export function usePreview() {
  const api = use(PreviewContext);
  if (!api) throw new Error("Preview is only available on public pages.");
  return api;
}

export function PreviewProvider({
  categories,
  hosts,
  events,
  children,
}: {
  categories: Category[];
  hosts: readonly string[];
  events: CampusEvent[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [openedOn, setOpenedOn] = useState(pathname);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const visible = openedOn === pathname ? selection : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (visible) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [visible]);

  function close() {
    setSelection(null);
  }

  const api: PreviewApi = {
    openEvent: (event) => {
      setOpenedOn(pathname);
      setSelection({ kind: "event", event });
    },
    openAchievement: (achievement) => {
      setOpenedOn(pathname);
      setSelection({
        kind: "achievement",
        achievement,
        related: events.find((event) => event.id === achievement.eventId) ?? null,
      });
    },
  };

  return (
    <PreviewContext.Provider value={api}>
      {children}
      <dialog
        ref={dialogRef}
        className="preview-dialog bg-background text-ink"
        aria-labelledby="preview-title"
        onClose={() => setSelection(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        {visible ? (
          <PreviewBody selection={visible} categories={categories} hosts={hosts} onClose={close} />
        ) : null}
      </dialog>
    </PreviewContext.Provider>
  );
}

function PreviewBody({
  selection,
  categories,
  hosts,
  onClose,
}: {
  selection: Selection;
  categories: Category[];
  hosts: readonly string[];
  onClose: () => void;
}) {
  if (selection.kind === "achievement") {
    const item = selection.achievement;
    const category = categoryById(categories, item.categoryId ?? "");
    return (
      <div className="flex h-full flex-col">
        <PreviewBar onClose={onClose} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <MediaFrame
            url={item.imageUrl}
            alt={item.imageAlt}
            hosts={hosts}
            title={item.title}
            kicker={category?.name ?? "Achievement"}
          />
          <div className="px-5 py-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">Achievement</p>
            <h2 id="preview-title" className="font-display mt-3 text-4xl leading-none text-ink">
              {item.title}
            </h2>
            <p className="mt-4 text-sm text-muted">
              {[item.competitionName, formatEventDate(item.eventDate), item.academicYear].filter(Boolean).join(" · ")}
            </p>
            {item.winnerName || item.award ? (
              <p className="mt-3 text-base text-ink">{[item.award, item.winnerName].filter(Boolean).join(" · ")}</p>
            ) : null}
            {item.resources.length ? (
              <ul className="mt-5 grid gap-2">
                {item.resources
                  .filter((resource) => resource.title.trim())
                  .map((resource, index) => {
                    const link = resource.href ? classifyNavigationUrl(resource.href) : null;
                    return (
                      <li key={`${resource.title}-${index}`} className="text-sm">
                        {link?.ok ? (
                          <a href={link.url} className="text-accent" rel="noopener noreferrer" target="_blank">
                            {resource.title}
                          </a>
                        ) : (
                          resource.title
                        )}
                      </li>
                    );
                  })}
              </ul>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {selection.related ? (
                <Link href={`/events/${selection.related.slug}`} className="rounded-md bg-ink px-4 py-2.5 text-sm text-white">
                  Open page
                </Link>
              ) : (
                <Link href="/achievements" className="rounded-md bg-ink px-4 py-2.5 text-sm text-white">
                  Open achievements
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const event = selection.event;
  const names = eventCategoryIds(event)
    .map((id) => categoryById(categories, id)?.name)
    .filter(Boolean);
  const registration = registrationState(event);
  const date = formatEventDate(event.eventDate);
  const end = formatEventDate(event.endDate);
  const listing =
    event.listing === "external"
      ? event.hostName || "Another school"
      : event.listing === "competition"
        ? "Competition"
        : "Event";

  return (
    <div className="flex h-full flex-col">
      <PreviewBar onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <MediaFrame
          url={event.coverImageUrl}
          alt={event.coverAlt}
          hosts={hosts}
          title={event.title}
          kicker={names[0] ?? undefined}
        />
        <div className="px-5 py-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            {[listing, names.join(" · ") || null].filter(Boolean).join(" · ")}
          </p>
          <h2 id="preview-title" className="font-display mt-3 text-4xl leading-none text-ink">
            {event.title}
          </h2>
          {event.listing === "external" && event.hostName ? (
            <p className="mt-3 text-sm text-ink">Hosted by {event.hostName}</p>
          ) : null}
          {date ? (
            <p className="mt-4 text-sm text-muted">
              {date}
              {end && end !== date ? ` – ${end}` : ""}
            </p>
          ) : null}
          <p className="mt-4 text-base leading-7 text-muted">{event.shortDescription}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/events/${event.slug}`} className="rounded-md bg-ink px-4 py-2.5 text-sm text-white">
              Open page
            </Link>
            {registration.state === "open" ? (
              <a
                href={registration.href}
                className="rounded-md border border-line px-4 py-2.5 text-sm"
                rel="noopener noreferrer"
                target="_blank"
              >
                {registration.label}
              </a>
            ) : null}
          </div>
          <VenueBlock event={event} compact />
          <PreviewExtras event={event} hosts={hosts} />
        </div>
      </div>
    </div>
  );
}

function PreviewBar({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">Preview</p>
      <button type="button" onClick={onClose} className="text-sm text-ink" autoFocus>
        Close
      </button>
    </div>
  );
}

export function PreviewTrigger({
  event,
  className,
  style,
  children,
}: {
  event: CampusEvent;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const { openEvent } = usePreview();
  return (
    <button type="button" className={`preview-hit ${className ?? ""}`} style={style} onClick={() => openEvent(event)}>
      {children}
    </button>
  );
}

export function PreviewAchievement({
  achievement,
  className,
  children,
}: {
  achievement: Achievement;
  className?: string;
  children: ReactNode;
}) {
  const { openAchievement } = usePreview();
  return (
    <button
      type="button"
      className={`preview-hit ${className ?? ""}`}
      onClick={() => openAchievement(achievement)}
    >
      {children}
    </button>
  );
}
