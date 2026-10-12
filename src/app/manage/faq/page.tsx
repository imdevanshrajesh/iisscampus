import { FaqForm } from "@/components/manage/faq-form";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getEditableFaqs } from "@/lib/data/queries";
import { requireAdministrator } from "@/lib/manage/access";

export default async function FaqManagePage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;
  const faqs = await getEditableFaqs();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">FAQ</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Published answers appear on the FAQ &amp; About page. Keep them short and school-specific.
      </p>
      <div className="mt-8 grid gap-6">
        <FaqForm faq={null} />
        {faqs.map((item) => (
          <FaqForm key={item.id} faq={item} />
        ))}
      </div>
    </div>
  );
}
