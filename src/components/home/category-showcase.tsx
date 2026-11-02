"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Cpu,
  Download,
  Flame,
  Leaf,
  Palette,
  PartyPopper,
  Trophy,
  Users,
} from "lucide-react";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { categoryStyle } from "@/lib/home/category-style";
import { classifyNavigationUrl } from "@/lib/media/url";
import type { CampusEvent, Category } from "@/lib/types";

function getCategoryIcon(slug: string) {
  switch (slug.toLowerCase()) {
    case "sports":
      return Trophy;
    case "academic":
      return BookOpen;
    case "cultural":
      return Palette;
    case "technology":
      return Cpu;
    case "sustainability":
      return Leaf;
    case "celebrations":
      return PartyPopper;
    case "student-initiatives":
      return Users;
    default:
      return Flame;
  }
}

export function CategoryShowcase({
  categories,
  events,
}: {
  categories: Category[];
  events: CampusEvent[];
}) {
  return (
    <section className="mx-auto max-w-[90rem] px-5 py-20 md:px-8 md:py-28">
      <RevealOnScroll>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ink/80 pb-6">
          <div>
            <p className="kicker text-accent font-semibold tracking-wider text-xs uppercase">
              Curated Streams
            </p>
            <h2 className="font-display mt-2 text-[clamp(2.6rem,5vw,4.5rem)] leading-[0.9] text-ink">
              Browse <span className="italic text-accent">by kind.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted">
            Explore dedicated sectors of student life. Filter activities, sports tournaments,
            academic symposia, and leadership programmes in a single tap.
          </p>
        </div>
      </RevealOnScroll>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category, index) => {
          const theme = categoryStyle(category.slug);
          const Icon = getCategoryIcon(category.slug);
          const pdf = category.pdfUrl ? classifyNavigationUrl(category.pdfUrl) : null;
          const count = events.filter(
            (e) => (e.categoryId === category.id || e.categoryIds?.includes(category.id)) && !e.isSample
          ).length;

          return (
            <RevealOnScroll key={category.id} delay={index * 50}>
              <div
                className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-line bg-white/90 p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:${theme.border}`}
                style={{
                  boxShadow: `0 8px 30px -10px ${theme.glow}`,
                }}
              >
                {/* Glow accent bubble on hover */}
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition duration-500 group-hover:scale-150 group-hover:opacity-40"
                  style={{ backgroundColor: theme.accent }}
                  aria-hidden="true"
                />

                <div>
                  {/* Top Bar: Icon + Count */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition duration-300 group-hover:scale-110 ${theme.bgLight}`}
                      style={{ color: theme.accent }}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${theme.badge}`}
                      >
                        {count > 0 ? `${count} ${count === 1 ? "Event" : "Events"}` : "Stream"}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="mt-5">
                    <Link
                      href={`/events?category=${category.slug}`}
                      className="font-display block text-2xl font-medium text-ink transition-colors group-hover:text-accent"
                    >
                      {category.name}
                    </Link>

                    <p className="mt-2 text-xs leading-5 text-muted line-clamp-3">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-xs">
                  {pdf?.ok ? (
                    <a
                      href={pdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-muted hover:text-ink transition"
                    >
                      <Download size={13} className="text-accent" />
                      <span>PDF Guide</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-muted/60 font-mono">
                      #{category.slug}
                    </span>
                  )}

                  <Link
                    href={`/events?category=${category.slug}`}
                    className="inline-flex items-center gap-1 font-semibold text-accent transition-transform group-hover:translate-x-1"
                  >
                    <span>View Events</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          );
        })}
      </div>
    </section>
  );
}
