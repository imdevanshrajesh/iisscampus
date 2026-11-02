import { ManageProgramsList } from "@/components/manage/manage-programs-list";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getEditableCustomPrograms } from "@/lib/data/queries";
import { requireWorkspace } from "@/lib/manage/access";

export default async function CustomProgramsPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;
  const programs = await getEditableCustomPrograms();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Special Initiatives</p>
          <h1 className="text-3xl font-medium tracking-tight text-ink mt-1">Custom Programs</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            All programs are collapsed by default. Click any program to expand and edit.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ManageProgramsList
          programs={programs}
          events={access.workspace.events}
          mediaHosts={access.workspace.mediaHosts}
        />
      </div>
    </div>
  );
}
