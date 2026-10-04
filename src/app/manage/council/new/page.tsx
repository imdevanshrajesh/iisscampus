import { CouncilForm } from "@/components/manage/council-form";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { requireWorkspace } from "@/lib/manage/access";

export default async function NewCouncilYearPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">New council year</h1>
      <p className="mt-2 text-sm text-muted">Save a draft first. Publishing is a separate step.</p>
      <div className="mt-8">
        <CouncilForm year={null} role={access.role} />
      </div>
    </div>
  );
}
