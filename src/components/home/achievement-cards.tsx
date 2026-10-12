import Link from "next/link";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { PreviewAchievement } from "@/components/preview/preview-provider";
import { TiltSurface } from "@/components/home/tilt-surface";
import { MediaFrame } from "@/components/media/media-frame";
import { categoryById, formatEventDate } from "@/lib/data/catalog";
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
    <div>
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-[clamp(2.4rem,4vw,3.5rem)] leading-none text-ink">Achievements</h2>
        <Link href="/achievements" className="text-link text-sm text-ink">
          Archive
        </Link>
      </div>
      {achievements.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {achievements.slice(0, 4).map((item, index) => {
            const category = categoryById(categories, item.categoryId ?? "");
            return (
              <RevealOnScroll key={item.id} delay={index * 70}>
                <TiltSurface>
                  <article className="overflow-hidden rounded-2xl border border-line bg-background">
                    <PreviewAchievement achievement={item} className="block w-full text-left">
                    <MediaFrame
                      url={item.imageUrl}
                      alt={item.imageAlt}
                      hosts={hosts}
                      title={item.title}
                      kicker={category?.name ?? "Achievement"}
                    />
                    <div className="p-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                        {[item.competitionName, formatEventDate(item.eventDate), item.academicYear]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <h3 className="mt-2 font-display text-xl leading-tight">{item.title}</h3>
                      {item.winnerName || item.award ? (
                        <p className="mt-2 text-sm text-muted">
                          {[item.award, item.winnerName].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                    </div>
                    </PreviewAchievement>
                  </article>
                </TiltSurface>
              </RevealOnScroll>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {["Competitions", "Awards"].map((label, index) => (
            <RevealOnScroll key={label} delay={index * 90}>
              <div className="placeholder-card">
                <span className="font-display text-4xl italic text-accent">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="kicker text-muted">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/75">Results appear here once they are published.</p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      )}
    </div>
  );
}
