import { classifyMediaUrl } from "@/lib/media/url";

type Props = {
  url: string | null;
  alt: string | null;
  hosts: readonly string[];
  title: string;
  kicker?: string;
  priority?: boolean;
};

export function MediaFrame({ url, alt, hosts, title, kicker, priority = false }: Props) {
  const classified = url ? classifyMediaUrl(url, hosts) : null;

  if (classified?.ok) {
    return (
      <div className="relative aspect-[3/2] overflow-hidden bg-wash">
        {/* External photographs are loaded by the browser. The server does not fetch them. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={classified.url}
          alt={alt?.trim() || ""}
          className="h-full w-full max-w-full object-cover"
          loading={priority ? "eager" : "lazy"}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-44 flex-col justify-between gap-6 bg-wash p-5">
      {kicker ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">{kicker}</p>
      ) : null}
      <p className="text-balance text-2xl font-medium leading-snug text-ink">{title}</p>
    </div>
  );
}
