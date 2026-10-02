import { classifyNavigationUrl } from "./url.ts";

export type VideoPresentation =
  | { kind: "youtube"; src: string; href: string }
  | { kind: "vimeo"; src: string; href: string }
  | { kind: "link"; href: string };

function youtubeId(url: URL) {
  if (url.hostname === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  }
  if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "embed" || parts[0] === "shorts") {
      const id = parts[1];
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }
  }
  return null;
}

function vimeoId(url: URL) {
  if (url.hostname !== "vimeo.com" && url.hostname !== "www.vimeo.com") return null;
  const id = url.pathname.split("/").filter(Boolean)[0];
  return id && /^\d+$/.test(id) ? id : null;
}

export function presentVideo(raw: string | null | undefined): VideoPresentation | null {
  if (!raw?.trim()) return null;
  const classified = classifyNavigationUrl(raw);
  if (!classified.ok) return null;
  const url = new URL(classified.url);
  const youtube = youtubeId(url);
  if (youtube) {
    return {
      kind: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${youtube}`,
      href: classified.url,
    };
  }
  const vimeo = vimeoId(url);
  if (vimeo) {
    return {
      kind: "vimeo",
      src: `https://player.vimeo.com/video/${vimeo}`,
      href: classified.url,
    };
  }
  return { kind: "link", href: classified.url };
}
