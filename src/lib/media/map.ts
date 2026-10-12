export function mapEmbedSrc(venue: string | null | undefined, mapUrl: string | null | undefined) {
  const place = venue?.trim() ?? "";
  if (mapUrl) {
    try {
      const url = new URL(mapUrl);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const google = host === "google.com" || host.endsWith(".google.com") || host === "maps.google.com";
      if (google && (url.pathname.includes("/embed") || url.searchParams.get("output") === "embed")) {
        return url.toString();
      }
      if (google) {
        const query = url.searchParams.get("q") || url.searchParams.get("query") || place;
        if (query) return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
      }
    } catch {
      return place ? `https://maps.google.com/maps?q=${encodeURIComponent(place)}&output=embed` : null;
    }
  }
  return place ? `https://maps.google.com/maps?q=${encodeURIComponent(place)}&output=embed` : null;
}
