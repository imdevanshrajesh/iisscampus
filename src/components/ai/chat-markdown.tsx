"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Compass, Calendar, Users, Trophy, Megaphone } from "lucide-react";

function getLinkIcon(href: string) {
  if (href.includes("/events")) return Calendar;
  if (href.includes("/council")) return Users;
  if (href.includes("/achievements")) return Trophy;
  if (href.includes("/announcements")) return Megaphone;
  return Compass;
}

function parseFormattedText(text: string): React.ReactNode[] {
  // Regex to match links [label](url), bold **bold**, and code `code`
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Check for link [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const href = linkMatch[2];
      const isInternal = href.startsWith("/") || href.startsWith("#");
      const IconComponent = getLinkIcon(href);

      const buttonClasses =
        "inline-flex items-center gap-1.5 px-3 py-1 my-1 text-xs font-medium rounded-md bg-[#c65a12]/10 text-[#c65a12] hover:bg-[#c65a12] hover:text-white border border-[#c65a12]/30 transition-colors shadow-xs group align-middle font-sans";

      if (isInternal) {
        return (
          <Link key={index} href={href} className={buttonClasses}>
            <IconComponent className="h-3.5 w-3.5 shrink-0 opacity-80 group-hover:opacity-100" />
            <span>{label}</span>
            <ArrowUpRight className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
          </Link>
        );
      }

      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses}
        >
          <IconComponent className="h-3.5 w-3.5 shrink-0 opacity-80 group-hover:opacity-100" />
          <span>{label}</span>
          <ArrowUpRight className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
        </a>
      );
    }

    // Check for bold **text**
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={index} className="font-semibold text-gray-900">
          {boldMatch[1]}
        </strong>
      );
    }

    // Check for inline code `code`
    const codeMatch = part.match(/^`([^`]+)`$/);
    if (codeMatch) {
      return (
        <code
          key={index}
          className="rounded bg-black/5 px-1.5 py-0.5 text-[0.8em] font-mono text-gray-800"
        >
          {codeMatch[1]}
        </code>
      );
    }

    // Plain text
    return <span key={index}>{part}</span>;
  });
}

export function ChatMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c65a12]" />
              <div className="flex-1">{parseFormattedText(item)}</div>
            </li>
          ))}
        </ul>,
      );
    } else {
      elements.push(
        <ol key={`list-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
              <span className="shrink-0 font-semibold text-xs text-[#c65a12] w-4">{idx + 1}.</span>
              <div className="flex-1">{parseFormattedText(item)}</div>
            </li>
          ))}
        </ol>,
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Check bullet list item (- or * or •)
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Check numbered list item (1. 2. etc.)
    const numberMatch = line.match(/^\d+\.\s+(.+)$/);
    if (numberMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numberMatch[1]);
      continue;
    }

    // Plain line: flush any pending list
    flushList();

    // Check heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      elements.push(
        <h4 key={`h-${elements.length}`} className="mt-3 mb-1 font-semibold text-gray-900 text-sm">
          {parseFormattedText(headingMatch[2])}
        </h4>,
      );
      continue;
    }

    // Paragraph
    elements.push(
      <p key={`p-${elements.length}`} className="my-1.5 text-sm leading-relaxed text-gray-700">
        {parseFormattedText(line)}
      </p>,
    );
  }

  flushList();

  return <div className="space-y-0.5">{elements}</div>;
}
