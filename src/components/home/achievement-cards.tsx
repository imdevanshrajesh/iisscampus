import Link from "next/link";
import { ArrowRight, Award, Trophy } from "lucide-react";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { PreviewAchievement } from "@/components/preview/preview-provider";
import { TiltSurface } from "@/components/home/tilt-surface";
import { categoryById, formatEventDate } from "@/lib/data/catalog";
import { classifyMediaUrl } from "@/lib/media/url";
import type { Achievement, Category } from "@/lib/types";

export function AchievementCards({
  achievements,
  categories,
  hosts,
}: {
  achievements: Achievement[];
  categories: Category[];
  hosts: readonly string[];
}) {
  return (
    <div className="flex flex-col justify-between">
      <div className="flex items-end justify-between gap-4 border-b border-ink/80 pb-4">
        <div>
          <p className="kicker text-muted">Hall of Fame</p>
          <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] leading-none text-ink mt-1">
            Campus <span className="italic text-accent">Achievements</span>
          </h2>
        </div>
        <Link
          href="/achievements"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent transition group"
        >
          <span>All awards</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {achievements.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {achievements.slice(0, 4).map((item, index) => {
            const category = categoryById(categories, item.categoryId ?? "");
            const validImage = item.imageUrl ? classifyMediaUrl(item.imageUrl, hosts) : null;

            return (
              <RevealOnScroll key={item.id} delay={index * 70}>
                <TiltSurface className="h-full">
                  <article className="group flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-white shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <PreviewAchievement achievement={item} className="flex h-full w-full flex-col justify-between text-left">
                      {/* Image Preview Frame */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-wash/60">
                        {validImage?.ok ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={validImage.url}
                            alt={item.imageAlt || item.title}
                            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-108"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center p-6 bg-gradient-to-br from-wash via-surface to-line/40 text-center">
                            <Trophy size={32} className="text-gold" />
                            <span className="font-display text-sm font-semibold text-ink/40 mt-2">
                              {item.competitionName || "Tournament Win"}
                            </span>
                          </div>
                        )}

                        {/* Category & Trophy Badge */}
                        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-ink shadow-xs backdrop-blur-md">
                            {category?.name ?? "Achievement"}
                          </span>
                          {item.award ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs backdrop-blur-md">
                              <Award size={11} />
                              <span>{item.award}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col justify-between p-4.5">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                            {[item.competitionName, formatEventDate(item.eventDate), item.academicYear]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <h3 className="mt-1.5 font-display text-lg font-medium leading-snug text-ink group-hover:text-accent transition">
                            {item.title}
                          </h3>
                          {item.winnerName ? (
                            <p className="mt-2 text-xs font-semibold text-accent">
                              Won by: {item.winnerName}
                            </p>
                          ) : null}
                        </div>

                        <div className="mt-4 pt-2 border-t border-line/50 flex justify-end">
                          <span className="text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform">
                            View details ↗
                          </span>
                        </div>
                      </div>
                    </PreviewAchievement>
                  </article>
                </TiltSurface>
              </RevealOnScroll>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-line/70 bg-white/70 p-8 text-center flex flex-col items-center justify-center min-h-[16rem]">
          <Trophy size={28} className="text-gold mb-2" />
          <p className="font-display text-lg text-ink font-medium">Campus Honors &amp; Accolades</p>
          <p className="mt-1 text-xs text-muted max-w-sm">
            Official records for regional athletic championships, academic congresses, and student awards.
          </p>
          <Link
            href="/achievements"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            <span>Explore Achievements</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}
