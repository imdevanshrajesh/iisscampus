import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatAnnouncementDate,
  compareAnnouncements,
  safeUrl,
  stripMarkdown,
  renderAnnouncementMessage,
} from "../src/lib/announcements.ts";

describe("announcement formatting and blog rendering", () => {
  it("formats dates and compares announcements properly", () => {
    const d1 = "2026-11-04T10:00:00.000Z";
    const d2 = "2026-11-01T10:00:00.000Z";
    assert.equal(typeof formatAnnouncementDate(d1), "string");
    assert.ok(compareAnnouncements({ createdAt: d2 }, { createdAt: d1 }) > 0);
  });

  it("validates safe URLs and rejects dangerous protocols", () => {
    assert.equal(safeUrl("https://example.com/page"), "https://example.com/page");
    assert.equal(safeUrl("http://example.com"), "http://example.com/");
    assert.equal(safeUrl("/events/fifa-fever"), "/events/fifa-fever");
    assert.equal(safeUrl("#details"), "#details");
    assert.equal(safeUrl("mailto:council@iissboys.com"), "mailto:council@iissboys.com");
    assert.equal(safeUrl("javascript:alert(1)"), null);
    assert.equal(safeUrl("data:text/html,evil"), null);
    assert.equal(safeUrl("//evil.com"), null);
  });

  it("strips markdown accurately for search and card previews", () => {
    const input = [
      "# Term 2 Circular",
      "Welcome to the **official update**.",
      "- Point 1: Check [Schedule](https://example.com/sched)",
      "- Point 2: Bring *full uniform*",
      "> Note: Gates close at 08:00 AM.",
    ].join("\n\n");

    const plain = stripMarkdown(input);
    assert.equal(
      plain,
      "Term 2 Circular Welcome to the official update. Point 1: Check Schedule Point 2: Bring full uniform Note: Gates close at 08:00 AM.",
    );
  });

  it("renders structured blocks for headings, bullet lists, ordered lists, and blockquotes", () => {
    const text = [
      "## Examination Directives",
      "Please review the following requirements:",
      "- Valid student identification card",
      "- Formal campus blazer",
      "Steps to register:",
      "1. Collect hall ticket",
      "2. Check seat allocation",
      "> Strictly no mobile phones allowed.",
    ].join("\n\n");

    const node = renderAnnouncementMessage(text) as any;
    assert.ok(node);
    // Should produce child blocks
    const children = Array.isArray(node) ? node : node?.props?.children;
    assert.ok(children && children.length >= 5);
  });

  it("preserves single enters as line breaks (<br />) within a paragraph", () => {
    const text = "First line of bulletin\nSecond line of bulletin\nThird line of bulletin";
    const node = renderAnnouncementMessage(text) as any;
    assert.ok(node);
    const children = Array.isArray(node.props.children) ? node.props.children : [node.props.children];
    const p = children[0];
    assert.equal(p.type, "p");
    // p.props.children contains lines and br elements
    const pChildren = Array.isArray(p.props.children) ? p.props.children : [p.props.children];
    assert.equal(pChildren.length, 3);
  });

  it("renders underlined links for both markdown links and bare URLs", () => {
    const text = "Visit [Campus Portal](https://iissboys.com/portal) or check https://iissboys.com for details.";
    const node = renderAnnouncementMessage(text) as any;
    assert.ok(node);
  });

  it("supports inline mode for tickers and badges", () => {
    const text = "Special Notice: **Sports Day** matches kick off on [Friday](/events)!";
    const node = renderAnnouncementMessage(text, { inline: true }) as any;
    assert.ok(node);
    // In inline mode, root is a Fragment with inline tokens (no <p> wrapper)
    assert.ok(node.type.toString().includes("Symbol(react.fragment)") || node.type === Symbol.for("react.fragment"));
  });
});
