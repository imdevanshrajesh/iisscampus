import Image from "next/image";

export const DEFAULT_COUNCIL_LOGO = "/brand/student-council.png";

/** Falls back to the repo logo when no HTTPS URL is saved in settings. */
export function resolveCouncilLogoUrl(url: string | null | undefined) {
  const trimmed = url?.trim() ?? "";
  if (trimmed.startsWith("https://")) return trimmed;
  return DEFAULT_COUNCIL_LOGO;
}

export function CouncilLogo({
  url,
  alt = "",
  width,
  height,
  className,
  priority = false,
}: {
  url?: string | null;
  alt?: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) {
  const src = resolveCouncilLogoUrl(url);
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      className={className}
      priority={priority}
    />
  );
}
