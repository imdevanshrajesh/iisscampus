import { MarqueeForm } from "@/components/manage/marquee-form";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getEditableMarquee } from "@/lib/data/queries";
import { requireAdministrator } from "@/lib/manage/access";

export default async function MarqueePage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;
  const messages = await getEditableMarquee();
  const events = access.workspace.events.filter((event) => event.publicationStatus === "published");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">Marquee</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        These lines scroll across the top of the site. They are separate from the announcements board.
      </p>
      <div className="mt-8 grid gap-6">
        <MarqueeForm item={null} events={events} />
        {messages.map((item) => (
          <MarqueeForm key={item.id} item={item} events={events} />
        ))}
      </div>
    </div>
  );
}
