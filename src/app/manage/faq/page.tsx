import { ManageFaqList } from "@/components/manage/manage-faq-list";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getEditableFaqs } from "@/lib/data/queries";
import { requireAdministrator } from "@/lib/manage/access";

export default async function FaqManagePage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;
  const faqs = await getEditableFaqs();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Public Help</p>
          <h1 className="text-3xl font-medium tracking-tight text-ink mt-1">Frequently Asked Questions</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            All FAQ items are collapsed by default. Click any question to expand and edit.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ManageFaqList faqs={faqs} />
      </div>
    </div>
  );
}
