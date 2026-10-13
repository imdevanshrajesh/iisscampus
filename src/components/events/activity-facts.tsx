import { paragraphs } from "@/lib/data/catalog";
import type { CampusEvent } from "@/lib/types";

export function ActivityFacts({ event }: { event: CampusEvent }) {
  const packing = event.packingList ? paragraphs(event.packingList) : [];
  if (!packing.length) return null;

  return (
    <section className="border-t border-line py-10">
      <h2 className="text-2xl font-medium tracking-tight">What to bring</h2>
      <div className="mt-4 max-w-2xl space-y-2 text-base leading-7 text-ink">
        {packing.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
