import { notFound } from "next/navigation";
import { CouncilForm } from "@/components/manage/council-form";
import { DeleteRecord } from "@/components/manage/delete-record";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { canDelete } from "@/lib/auth/permissions";
import { deleteCouncilYear } from "@/lib/manage/actions";
import { requireWorkspace } from "@/lib/manage/access";

export default async function EditCouncilYearPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;
  const year = access.workspace.councilYears.find((item) => item.id === id);
  if (!year) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{year.publicationStatus.replace("_", " ")}</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">{year.label}</h1>
      <div className="mt-8">
        <CouncilForm year={year} role={access.role} />
      </div>
      {canDelete({ userId: "staff", role: access.role }, year.publicationStatus) ? (
        <div className="mt-10 border-t border-line pt-6">
          <h2 className="text-lg font-medium">Delete this year</h2>
          <p className="mt-2 text-sm text-muted">This removes the year, its photographs, and its posts.</p>
          <div className="mt-4">
            <DeleteRecord action={deleteCouncilYear} id={year.id} label="Delete year" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
