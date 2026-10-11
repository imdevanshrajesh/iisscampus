import { classifyNavigationUrl } from "@/lib/media/url";
import type { ContentResource } from "@/lib/types";

export function ResourceCards({
  resources,
  title = "Details",
}: {
  resources: ContentResource[];
  title?: string;
}) {
  const visible = resources.filter((item) => item.title.trim());
  if (!visible.length) return null;

  return (
    <section className="border-t border-line py-10">
      <h2 className="text-2xl font-medium tracking-tight">{title}</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {visible.map((item) => {
          const link = item.href ? classifyNavigationUrl(item.href) : null;
          const href = link?.ok ? link.url : null;
          return (
            <li key={`${item.title}-${item.href ?? ""}`} className="rounded-xl border border-line bg-background p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                {item.kind === "pdf" ? "PDF" : item.kind === "link" ? "Link" : "Card"}
              </p>
              <h3 className="mt-2 text-lg font-medium tracking-tight">{item.title}</h3>
              {item.detail ? <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p> : null}
              {href ? (
                <a
                  href={href}
                  className="mt-4 inline-flex text-sm text-accent"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {item.kind === "pdf" ? "Download PDF" : "Open link"}
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
