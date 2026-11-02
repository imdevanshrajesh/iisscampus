import { compareCampusEvents, formatEventDate, selectPublicEvents } from "@/lib/data/catalog";
import type { CampusEvent, NavGroup, NavIncludeListing, NavItem, PublicNavGroup } from "@/lib/types";

export type NavLink = { href: string; label: string };

export const primaryNav: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/competitions", label: "Competitions" },
  { href: "/council", label: "Council" },
  { href: "/announcements", label: "Notices" },
  { href: "/council/socials", label: "Socials" },
  { href: "/achievements", label: "Achievements" },
  { href: "/gallery", label: "Gallery" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/wellness", label: "Wellness" },
  { href: "/about", label: "FAQ & About" },
  { href: "/suggestions", label: "Suggestions" },
];

export function withWellnessNavLabel(navLabel?: string | null): NavLink[] {
  const label = navLabel?.trim() || "Wellness";
  return primaryNav.map((link) => (link.href === "/wellness" ? { ...link, label } : link));
}

function item(
  id: string,
  groupId: string,
  title: string,
  description: string,
  href: string,
  sortOrder: number,
): NavItem {
  return {
    id,
    groupId,
    title,
    description,
    href,
    eventId: null,
    enabled: true,
    sortOrder,
  };
}

export const defaultNavGroups: NavGroup[] = [
  {
    id: "nav-home",
    label: "Home",
    href: "/",
    includeListing: null,
    enabled: true,
    sortOrder: 0,
    items: [],
  },
  {
    id: "nav-events",
    label: "Events",
    href: null,
    includeListing: "event",
    enabled: true,
    sortOrder: 10,
    items: [item("nav-events-all", "nav-events", "All events", "Everything coming up on campus", "/events", 0)],
  },
  {
    id: "nav-competitions",
    label: "Competitions",
    href: null,
    includeListing: "competition",
    enabled: true,
    sortOrder: 20,
    items: [
      item(
        "nav-competitions-all",
        "nav-competitions",
        "All competitions",
        "Contests and fixtures on campus",
        "/competitions",
        0,
      ),
    ],
  },
  {
    id: "nav-council",
    label: "Council",
    href: null,
    includeListing: null,
    enabled: true,
    sortOrder: 30,
    items: [
      item("nav-council-page", "nav-council", "The council", "Meet the boys' student council", "/council", 0),
      item("nav-notices", "nav-council", "Campus Notices", "Official circulars & directives", "/announcements", 3),
      item("nav-socials", "nav-council", "Socials", "Pinned Instagram posts and council accounts", "/council/socials", 5),
      item("nav-suggestions", "nav-council", "Suggestions", "Send a note to the council", "/suggestions", 10),
    ],
  },
  {
    id: "nav-school",
    label: "School",
    href: null,
    includeListing: null,
    enabled: true,
    sortOrder: 40,
    items: [
      item("nav-gallery", "nav-school", "Gallery", "Photographs from campus", "/gallery", 0),
      item("nav-newsletter", "nav-school", "Newsletter", "The latest letter", "/newsletter", 10),
      item("nav-wellness", "nav-school", "Wellness", "A quiet corner for wellbeing", "/wellness", 20),
      item("nav-achievements", "nav-school", "Achievements", "Awards and results", "/achievements", 30),
      item("nav-about", "nav-school", "FAQ & About", "Questions and how the council works", "/about", 40),
    ],
  },
];

function clip(value: string, max = 140) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function eventHref(event: CampusEvent) {
  return `/events/${event.slug}`;
}

function eventLine(event: CampusEvent) {
  return clip(event.shortDescription) || formatEventDate(event.eventDate) || (event.eventStatus === "ongoing" ? "On now" : "Coming up");
}

export function resolvePublicNav(
  groups: NavGroup[],
  events: CampusEvent[],
  wellnessLabel?: string | null,
): PublicNavGroup[] {
  const published = selectPublicEvents(events).filter((event) => !event.isSample);
  const byId = new Map(published.map((event) => [event.id, event]));
  const label = wellnessLabel?.trim();

  return groups
    .filter((group) => group.enabled)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
    .map((group) => {
      const links = group.items
        .filter((entry) => entry.enabled)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
        .flatMap((entry) => {
          if (entry.eventId) {
            const event = byId.get(entry.eventId);
            if (!event) return [];
            return [{ title: event.title, description: eventLine(event), href: eventHref(event) }];
          }
          if (!entry.href || !entry.title.trim()) return [];
          const title = entry.href === "/wellness" && label ? label : entry.title;
          return [{ title, description: entry.description.trim(), href: entry.href }];
        });

      if (group.includeListing) {
        const listingIndex =
          group.includeListing === "event"
            ? { title: "All events", description: "Everything coming up on campus", href: "/events" }
            : { title: "All competitions", description: "Contests and fixtures on campus", href: "/competitions" };
        if (!links.some((link) => link.href === listingIndex.href)) links.unshift(listingIndex);
        const seen = new Set(links.map((link) => link.href));
        const picked = new Set(group.items.map((entry) => entry.eventId).filter((id): id is string => Boolean(id)));
        const extras = published
          .filter((event) => event.listing === group.includeListing)
          .filter((event) => event.eventStatus === "upcoming" || event.eventStatus === "ongoing")
          .filter((event) => !picked.has(event.id) && !seen.has(eventHref(event)))
          .sort(compareCampusEvents)
          .slice(0, 4);
        for (const event of extras) {
          links.push({ title: event.title, description: eventLine(event), href: eventHref(event) });
        }
      }

      const councilGroup =
        group.label.trim().toLowerCase() === "council" || group.items.some((entry) => entry.href === "/council");
      if (!councilGroup) {
        for (let index = links.length - 1; index >= 0; index -= 1) {
          if (links[index]?.href === "/suggestions" || links[index]?.href === "/council/socials") {
            links.splice(index, 1);
          }
        }
      } else {
        if (!links.some((link) => link.href === "/announcements")) {
          const councilIdx = links.findIndex((l) => l.href === "/council");
          const insertAt = councilIdx >= 0 ? councilIdx + 1 : 0;
          links.splice(insertAt, 0, {
            title: "Campus Notices",
            description: "Official circulars & directives",
            href: "/announcements",
          });
        }
        if (!links.some((link) => link.href === "/council/socials")) {
          const councilIdx = links.findIndex((l) => l.href === "/announcements" || l.href === "/council");
          const insertAt = councilIdx >= 0 ? councilIdx + 1 : 0;
          links.splice(insertAt, 0, {
            title: "Socials",
            description: "Pinned Instagram posts and council accounts",
            href: "/council/socials",
          });
        }
        if (!links.some((link) => link.href === "/suggestions")) {
          links.push({
            title: "Suggestions",
            description: "Send a note to the council",
            href: "/suggestions",
          });
        }
      }

      if (!links.length && !group.href) return null;
      return {
        id: group.id,
        label: group.label,
        href: links.length ? null : group.href,
        links,
      };
    })
    .filter((group): group is PublicNavGroup => Boolean(group));
}

export function isNavIncludeListing(value: string | null): value is NavIncludeListing {
  return value === "event" || value === "competition";
}
