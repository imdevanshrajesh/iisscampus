import type { ReactNode } from "react";
import { createElement, Fragment } from "react";

export function compareAnnouncements(a: { createdAt: string }, b: { createdAt: string }) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function formatAnnouncementDate(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/** Validates and normalizes safe URLs for announcement and blog links. */
export function safeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Internal campus routes (e.g. /events, /announcements, #details)
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
    if (trimmed.startsWith("//")) return null; // disallow protocol-relative URLs
    return trimmed;
  }

  // mailto: links
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(trimmed)) {
    return trimmed;
  }

  // Standard web links
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

type InlineToken =
  | { type: "text"; value: string }
  | { type: "link"; label: string; href: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "underline"; value: string }
  | { type: "strike"; value: string }
  | { type: "code"; value: string };

const LINK_REGEX = /\[([^\]]+)\]\(([^)\s]+)\)/;
const BARE_URL_REGEX = /\b(https?:\/\/[^\s<>)"]+)/;
const BOLD_REGEX = /\*\*([^*]+)\*\*|__([^_]+)__/;
const UNDERLINE_REGEX = /<u>([\s\S]*?)<\/u>|\+([^+]+)\+/;
const STRIKE_REGEX = /~~([^~]+)~~/;
const CODE_REGEX = /`([^`]+)`/;
const ITALIC_REGEX = /(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/;

/**
 * Tokenizes inline text by finding the earliest matching pattern iteratively.
 */
function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    type MatchCandidate = {
      index: number;
      length: number;
      token: InlineToken;
    };

    let earliest: MatchCandidate | null = null;

    // 1. Markdown link: [label](url)
    const linkMatch = remaining.match(LINK_REGEX);
    if (linkMatch && linkMatch.index !== undefined) {
      const href = safeUrl(linkMatch[2]);
      earliest = {
        index: linkMatch.index,
        length: linkMatch[0].length,
        token: href
          ? { type: "link", label: linkMatch[1], href }
          : { type: "text", value: linkMatch[0] },
      };
    }

    // 2. Bare URL: https://...
    const bareMatch = remaining.match(BARE_URL_REGEX);
    if (bareMatch && bareMatch.index !== undefined) {
      if (!earliest || bareMatch.index < earliest.index) {
        // Strip trailing punctuation commonly typed after URLs
        const raw = bareMatch[1];
        const cleaned = raw.replace(/[.,;:!?)]+$/, "");
        const href = safeUrl(cleaned);
        earliest = {
          index: bareMatch.index,
          length: cleaned.length,
          token: href
            ? { type: "link", label: cleaned, href }
            : { type: "text", value: cleaned },
        };
      }
    }

    // 3. Bold: **text** or __text__
    const boldMatch = remaining.match(BOLD_REGEX);
    if (boldMatch && boldMatch.index !== undefined) {
      if (!earliest || boldMatch.index < earliest.index) {
        earliest = {
          index: boldMatch.index,
          length: boldMatch[0].length,
          token: { type: "bold", value: boldMatch[1] || boldMatch[2] },
        };
      }
    }

    // 4. Underline: <u>text</u> or +text+
    const underlineMatch = remaining.match(UNDERLINE_REGEX);
    if (underlineMatch && underlineMatch.index !== undefined) {
      if (!earliest || underlineMatch.index < earliest.index) {
        earliest = {
          index: underlineMatch.index,
          length: underlineMatch[0].length,
          token: { type: "underline", value: underlineMatch[1] || underlineMatch[2] },
        };
      }
    }

    // 5. Strike: ~~text~~
    const strikeMatch = remaining.match(STRIKE_REGEX);
    if (strikeMatch && strikeMatch.index !== undefined) {
      if (!earliest || strikeMatch.index < earliest.index) {
        earliest = {
          index: strikeMatch.index,
          length: strikeMatch[0].length,
          token: { type: "strike", value: strikeMatch[1] },
        };
      }
    }

    // 6. Code: `code`
    const codeMatch = remaining.match(CODE_REGEX);
    if (codeMatch && codeMatch.index !== undefined) {
      if (!earliest || codeMatch.index < earliest.index) {
        earliest = {
          index: codeMatch.index,
          length: codeMatch[0].length,
          token: { type: "code", value: codeMatch[1] },
        };
      }
    }

    // 7. Italic: *text* or _text_
    const italicMatch = remaining.match(ITALIC_REGEX);
    if (italicMatch && italicMatch.index !== undefined) {
      if (!earliest || italicMatch.index < earliest.index) {
        earliest = {
          index: italicMatch.index,
          length: italicMatch[0].length,
          token: { type: "italic", value: italicMatch[1] || italicMatch[2] },
        };
      }
    }

    // If no pattern matched, the rest is plain text
    if (!earliest) {
      tokens.push({ type: "text", value: remaining });
      break;
    }

    // Append any text preceding the match
    if (earliest.index > 0) {
      tokens.push({ type: "text", value: remaining.slice(0, earliest.index) });
    }

    tokens.push(earliest.token);
    remaining = remaining.slice(earliest.index + earliest.length);
  }

  return tokens;
}

/** Renders parsed inline tokens into React nodes with underline/bold/link styling. */
function renderInline(text: string, keyPrefix = "", depth = 0): ReactNode[] {
  if (!text) return [];
  if (depth > 3) return [text];

  const tokens = tokenizeInline(text);
  return tokens.map((token, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (token.type === "text") {
      return token.value;
    }
    if (token.type === "link") {
      const isExternal = token.href.startsWith("http://") || token.href.startsWith("https://");
      return createElement(
        "a",
        {
          key,
          href: token.href,
          target: isExternal ? "_blank" : undefined,
          rel: isExternal ? "noopener noreferrer" : undefined,
          className:
            "font-medium text-accent underline underline-offset-4 decoration-accent/60 hover:decoration-accent hover:text-accent transition-colors",
        },
        ...renderInline(token.label, `${key}-l`, depth + 1),
      );
    }
    if (token.type === "bold") {
      return createElement(
        "strong",
        { key, className: "font-semibold text-ink" },
        ...renderInline(token.value, `${key}-b`, depth + 1),
      );
    }
    if (token.type === "underline") {
      return createElement(
        "span",
        { key, className: "underline underline-offset-4 decoration-current" },
        ...renderInline(token.value, `${key}-u`, depth + 1),
      );
    }
    if (token.type === "italic") {
      return createElement(
        "em",
        { key, className: "italic" },
        ...renderInline(token.value, `${key}-i`, depth + 1),
      );
    }
    if (token.type === "strike") {
      return createElement(
        "del",
        { key, className: "line-through text-muted/80" },
        ...renderInline(token.value, `${key}-s`, depth + 1),
      );
    }
    if (token.type === "code") {
      return createElement(
        "code",
        {
          key,
          className:
            "rounded bg-wash px-1.5 py-0.5 font-mono text-[0.875em] text-accent border border-line/60",
        },
        token.value,
      );
    }
    return null;
  });
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "bullet-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "blockquote"; lines: string[] }
  | { type: "hr" }
  | { type: "paragraph"; lines: string[] };

/** Splits a message into structured blocks (paragraphs, lists, headings, quotes, dividers). */
function parseBlocks(message: string): Block[] {
  const rawLines = message.split(/\r?\n/);
  const blocks: Block[] = [];
  let currentBlock: Block | null = null;

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();

    // Empty line: terminates current block
    if (!trimmed) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // Heading: # Heading, ## Heading, ### Heading, etc.
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    // Horizontal rule: ---, ***, ___
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ type: "hr" });
      continue;
    }

    // Bullet list item: - item, * item, + item, • item
    const bulletMatch = trimmed.match(/^([-*+•]|\u2022)\s+(.+)$/);
    if (bulletMatch) {
      if (currentBlock && currentBlock.type === "bullet-list") {
        currentBlock.items.push(bulletMatch[2].trim());
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: "bullet-list", items: [bulletMatch[2].trim()] };
      }
      continue;
    }

    // Numbered list item: 1. item, 2) item, etc.
    const orderedMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (orderedMatch) {
      if (currentBlock && currentBlock.type === "ordered-list") {
        currentBlock.items.push(orderedMatch[2].trim());
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: "ordered-list", items: [orderedMatch[2].trim()] };
      }
      continue;
    }

    // Blockquote: > quote
    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      if (currentBlock && currentBlock.type === "blockquote") {
        currentBlock.lines.push(quoteMatch[1]);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: "blockquote", lines: [quoteMatch[1]] };
      }
      continue;
    }

    // Regular line in paragraph:
    // If current block is a paragraph, keep accumulating lines (enters inside a paragraph).
    // Otherwise start a new paragraph.
    if (currentBlock && currentBlock.type === "paragraph") {
      currentBlock.lines.push(rawLine);
    } else {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: "paragraph", lines: [rawLine] };
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Strips markdown and block formatting for clean plain-text previews (e.g. meta descriptions and cards).
 */
export function stripMarkdown(message: string): string {
  if (!message) return "";
  return message
    // Markdown links [label](url) -> label
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    // Formatting tokens
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/<u>([\s\S]*?)<\/u>/gi, "$1")
    .replace(/\+([^+]+)\+/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_]+)_(?!_)/g, "$1")
    // Block markers
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^([-*+•]|\u2022)\s+/gm, "")
    .replace(/^\d+[.)]\s+/gm, "")
    .replace(/^(-{3,}|\*{3,}|_{3,})$/gm, "")
    // Collapse whitespace and newlines
    .replace(/\s+/g, " ")
    .trim();
}

export type RenderAnnouncementOptions = {
  inline?: boolean;
  className?: string;
};

/**
 * Renders announcement and blog content with full rich-text formatting:
 * - Preserves enters/newlines (single enter = <br />, double enter = new paragraph)
 * - Bullet lists (- item, * item, • item)
 * - Numbered lists (1. item, 2. item)
 * - Underlined, clickable links ([text](url) and bare URLs)
 * - Headings (# H1, ## H2, ### H3)
 * - Blockquotes (> quote)
 * - Bold (**text**), Italic (*text*), Underline (<u>text</u>), Strikethrough (~~text~~), Code (`text`)
 */
export function renderAnnouncementMessage(
  message: string,
  options?: RenderAnnouncementOptions,
): ReactNode {
  if (!message || !message.trim()) return null;

  // Inline mode: flatten into inline text (for announcement bar tickers or badges)
  if (options?.inline) {
    const singleLine = message.replace(/\r?\n+/g, " ").trim();
    return createElement(Fragment, null, ...renderInline(singleLine, "inline"));
  }

  const blocks = parseBlocks(message);

  const renderedBlocks = blocks.map((block, bIdx) => {
    const bKey = `block-${bIdx}`;

    if (block.type === "heading") {
      const headingClasses: Record<number, string> = {
        1: "font-display text-2xl sm:text-3xl font-bold text-ink mt-8 mb-3 pt-2",
        2: "font-display text-xl sm:text-2xl font-bold text-ink mt-6 mb-2",
        3: "font-display text-lg sm:text-xl font-semibold text-ink mt-5 mb-2",
        4: "font-sans text-base font-semibold text-ink mt-4 mb-1",
        5: "font-sans text-sm font-semibold uppercase tracking-wider text-muted mt-3 mb-1",
        6: "font-sans text-xs font-semibold uppercase tracking-wider text-muted mt-2 mb-1",
      };
      const tag = block.level <= 2 ? "h2" : block.level === 3 ? "h3" : "h4";
      return createElement(
        tag,
        { key: bKey, className: headingClasses[block.level] || headingClasses[3] },
        ...renderInline(block.text, bKey),
      );
    }

    if (block.type === "bullet-list") {
      return createElement(
        "ul",
        {
          key: bKey,
          className: "my-4 space-y-2 pl-6 list-disc marker:text-accent text-ink/90",
        },
        ...block.items.map((item, iIdx) =>
          createElement(
            "li",
            { key: `${bKey}-item-${iIdx}`, className: "leading-relaxed" },
            ...renderInline(item, `${bKey}-i-${iIdx}`),
          ),
        ),
      );
    }

    if (block.type === "ordered-list") {
      return createElement(
        "ol",
        {
          key: bKey,
          className: "my-4 space-y-2 pl-6 list-decimal marker:text-accent font-normal text-ink/90",
        },
        ...block.items.map((item, iIdx) =>
          createElement(
            "li",
            { key: `${bKey}-item-${iIdx}`, className: "leading-relaxed" },
            ...renderInline(item, `${bKey}-i-${iIdx}`),
          ),
        ),
      );
    }

    if (block.type === "blockquote") {
      return createElement(
        "blockquote",
        {
          key: bKey,
          className:
            "my-4 border-l-4 border-accent/70 bg-wash/50 pl-4 pr-3 py-2.5 italic text-ink/85 rounded-r-lg space-y-1",
        },
        ...block.lines.map((line, lIdx) =>
          createElement(
            Fragment,
            { key: `${bKey}-q-${lIdx}` },
            lIdx > 0 ? createElement("br") : null,
            ...renderInline(line, `${bKey}-ql-${lIdx}`),
          ),
        ),
      );
    }

    if (block.type === "hr") {
      return createElement("hr", { key: bKey, className: "my-6 border-line/80" });
    }

    // Paragraph block: single enters preserved as <br />, multiple paragraphs separated
    return createElement(
      "p",
      { key: bKey, className: "my-3 leading-relaxed text-ink/90" },
      ...block.lines.map((line, lIdx) =>
        createElement(
          Fragment,
          { key: `${bKey}-p-${lIdx}` },
          lIdx > 0 ? createElement("br") : null,
          ...renderInline(line, `${bKey}-pl-${lIdx}`),
        ),
      ),
    );
  });

  if (options?.className) {
    return createElement("div", { className: options.className }, ...renderedBlocks);
  }

  return createElement(Fragment, null, ...renderedBlocks);
}
