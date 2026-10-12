import type { ReactNode } from "react";
import { createElement, Fragment } from "react";

type Token =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "link"; label: string; href: string };

const linkPattern = /\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g;
const boldPattern = /\*\*([^*]+)\*\*/g;
const italicPattern = /(?<!\*)\*([^*]+)\*(?!\*)|_([^_]+)_/g;

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function tokenize(message: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  const combined = new RegExp(
    `${linkPattern.source}|${boldPattern.source}|${italicPattern.source}`,
    "g",
  );

  for (const match of message.matchAll(combined)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      tokens.push({ type: "text", value: message.slice(cursor, index) });
    }
    if (match[1] && match[2]) {
      const href = safeHttpUrl(match[2]);
      if (href) tokens.push({ type: "link", label: match[1], href });
      else tokens.push({ type: "text", value: match[0] });
    } else if (match[3]) {
      tokens.push({ type: "bold", value: match[3] });
    } else if (match[4] || match[5]) {
      tokens.push({ type: "italic", value: match[4] || match[5] });
    } else {
      tokens.push({ type: "text", value: match[0] });
    }
    cursor = index + match[0].length;
  }

  if (cursor < message.length) {
    tokens.push({ type: "text", value: message.slice(cursor) });
  }
  return tokens;
}

/** Renders a small markdown subset: **bold**, *italic*, and [label](https://...). */
export function renderAnnouncementMessage(message: string): ReactNode {
  const tokens = tokenize(message);
  return createElement(
    Fragment,
    null,
    ...tokens.map((token, index) => {
      if (token.type === "text") return token.value;
      if (token.type === "bold") return createElement("strong", { key: index }, token.value);
      if (token.type === "italic") return createElement("em", { key: index }, token.value);
      return createElement(
        "a",
        {
          key: index,
          href: token.href,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "underline underline-offset-2",
        },
        token.label,
      );
    }),
  );
}
