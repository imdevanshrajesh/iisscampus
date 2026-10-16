import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { classifyNavigationUrl } from "@/lib/media/url";
import type { CustomProgram } from "@/lib/types";

export function CustomProgramCards({ programs }: { programs: CustomProgram[] }) {
  if (!programs.length) return null;

  return (
    <section className="mt-16 border-t border-line pt-12 md:mt-20">
      <p className="kicker text-accent">Programs</p>
      <h2 className="font-display mt-3 text-4xl text-ink md:text-5xl">Custom programs</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => {
          const [cover, ...rest] = program.photos;
          const website = program.websiteUrl ? classifyNavigationUrl(program.websiteUrl) : null;
          return (
            <article key={program.id} className="flex flex-col overflow-hidden rounded-2xl border border-line">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover.url} alt={cover.alt || program.title} className="aspect-[16/10] w-full object-cover" />
              ) : null}
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="text-lg font-medium text-ink">{program.title}</h3>
                {program.summary ? (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted">{program.summary}</p>
                ) : null}
                {rest.length ? (
                  <div className="flex gap-2 overflow-x-auto">
                    {rest.map((photo) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={photo.url}
                        src={photo.url}
                        alt={photo.alt}
                        className="h-16 w-16 shrink-0 rounded-lg border border-line object-cover"
                      />
                    ))}
                  </div>
                ) : null}
                {program.event ? (
                  <Link href={`/events/${program.event.slug}`} className="text-link text-sm text-ink">
                    {program.event.title}
                  </Link>
                ) : null}
                <div className="mt-auto flex flex-col items-start gap-2 pt-2">
                  {website?.ok ? (
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink"
                    >
                      {program.websiteLabel || "Website"}
                      <ArrowUpRight aria-hidden="true" size={14} />
                    </a>
                  ) : null}
                  {program.links.map((link) => {
                    const href = classifyNavigationUrl(link.url);
                    if (!href.ok) return null;
                    return (
                      <a
                        key={`${link.label}-${link.url}`}
                        href={href.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-link inline-flex items-center gap-1 text-sm text-ink"
                      >
                        {link.label}
                        <ArrowUpRight aria-hidden="true" size={13} />
                      </a>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
