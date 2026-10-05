import { IMAGE_URL_EXAMPLE } from "@/lib/media/guide";

export function ImageUrlHint() {
  return (
    <p className="text-xs leading-5 text-muted">
      Paste a direct{" "}
      <span className="font-mono text-[11px]">https://</span> image address from an approved host. Example:{" "}
      <span className="break-all font-mono text-[11px]">{IMAGE_URL_EXAMPLE}</span>
    </p>
  );
}
