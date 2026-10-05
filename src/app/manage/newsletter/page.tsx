import { NewsletterForm } from "@/components/manage/newsletter-form";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getEditableNewsletter } from "@/lib/data/queries";
import { requireWorkspace } from "@/lib/manage/access";

export default async function ManageNewsletterPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;
  const newsletter = await getEditableNewsletter();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="font-display text-4xl text-ink">Newsletter</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        The current monthly issue. The image opens the link.
      </p>
      <div className="mt-8">
        <NewsletterForm newsletter={newsletter} />
      </div>
    </div>
  );
}
