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

  return (
    <div className="relative aspect-[3/2] overflow-hidden bg-wash">
      {classified?.ok ? (
        // External photographs are loaded by the browser. The server does not fetch them.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={classified.url}
          alt={alt?.trim() || ""}
          className="h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
        />
      ) : (
        <div className="flex h-full flex-col justify-between p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
            {kicker ?? "Campus record"}
          </p>
          <p className="max-w-[12ch] text-[1.65rem] font-medium leading-none tracking-tight text-ink">
            {title}
          </p>
        </div>
      )}
    </div>
  );
}
