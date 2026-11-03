"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Compass, Calendar, Users, Trophy, Megaphone, HelpCircle } from "lucide-react";

function getLinkIcon(href: string) {
  if (href.includes("/events")) return Calendar;
  if (href.includes("/council")) return Users;
  if (href.includes("/achievements")) return Trophy;
  if (href.includes("/announcements")) return Megaphone;
  if (href.includes("/faq")) return HelpCircle;
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
        "inline-flex items-center gap-1.5 px-2.5 py-1 my-0.5 text-xs font-medium rounded-md bg-[#c65a12]/10 text-[#c65a12] hover:bg-[#c65a12] hover:text-white border border-[#c65a12]/30 transition-colors shadow-2xs group align-middle font-sans";

      if (isInternal) {
        return (
          <Link key={index} href={href} className={buttonClasses}>
            <IconComponent className="h-3 w-3 shrink-0 opacity-80 group-hover:opacity-100" />
            <span>{label}</span>
            <ArrowUpRight className="h-2.5 w-2.5 shrink-0 opacity-70 group-hover:opacity-100" />
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
          <IconComponent className="h-3 w-3 shrink-0 opacity-80 group-hover:opacity-100" />
          <span>{label}</span>
          <ArrowUpRight className="h-2.5 w-2.5 shrink-0 opacity-70 group-hover:opacity-100" />
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

function splitTableRow(line: string): string[] {
  let cleaned = line.trim();
  if (cleaned.startsWith("|")) cleaned = cleaned.slice(1);
  if (cleaned.endsWith("|")) cleaned = cleaned.slice(0, -1);
  return cleaned.split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  return /^\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?$/.test(trimmed);
}

function parseAlignments(line: string): ("left" | "center" | "right")[] {
  const parts = splitTableRow(line);
  return parts.map((part) => {
    const trimmed = part.trim();
    const starts = trimmed.startsWith(":");
    const ends = trimmed.endsWith(":");
    if (starts && ends) return "center";
    if (ends) return "right";
    return "left";
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
              <div className="flex-1 min-w-0">{parseFormattedText(item)}</div>
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
              <div className="flex-1 min-w-0">{parseFormattedText(item)}</div>
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

    // Check code blocks ```
    if (line.startsWith("```")) {
      flushList();
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div
          key={`code-${elements.length}`}
          className="my-2.5 overflow-hidden rounded-xl border border-gray-200 bg-gray-900 text-gray-100 shadow-2xs"
        >
          {lang && (
            <div className="border-b border-gray-800 px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-gray-400">
              {lang}
            </div>
          )}
          <pre className="overflow-x-auto p-3 text-xs font-mono leading-relaxed">
            <code>{codeLines.join("\n")}</code>
          </pre>
        </div>,
      );
      continue;
    }

    // Check Markdown Table: header line followed by separator line
    if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flushList();
      const headers = splitTableRow(line);
      const alignments = parseAlignments(lines[i + 1]);
      const tableRows: string[][] = [];

      i += 2; // Move past header and separator
      while (i < lines.length && lines[i].trim().includes("|") && !isTableSeparator(lines[i])) {
        tableRows.push(splitTableRow(lines[i]));
        i++;
      }
      i--; // Rewind one line since outer loop increments

      elements.push(
        <div
          key={`tbl-${elements.length}`}
          className="my-3 w-full max-w-full overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-2xs"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/90 text-gray-700">
                  {headers.map((h, hIdx) => {
                    const align = alignments[hIdx] || "left";
                    return (
                      <th
                        key={hIdx}
                        className={`px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap ${
                          align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
                        }`}
                      >
                        {parseFormattedText(h)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-amber-50/35 even:bg-gray-50/40 transition-colors"
                  >
                    {row.map((cell, cIdx) => {
                      const align = alignments[cIdx] || "left";
                      return (
                        <td
                          key={cIdx}
                          className={`px-3.5 py-2 text-gray-700 leading-normal align-middle ${
                            align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
                          }`}
                        >
                          {parseFormattedText(cell)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>,
      );
      continue;
    }

    // Check blockquote >
    if (line.startsWith(">")) {
      flushList();
      const quoteText = line.replace(/^>\s*/, "");
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          className="my-2 border-l-2 border-[#c65a12] pl-3 py-1 text-xs italic text-gray-600 bg-[#c65a12]/5 rounded-r"
        >
          {parseFormattedText(quoteText)}
        </blockquote>,
      );
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
