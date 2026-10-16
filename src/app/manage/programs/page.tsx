import { CustomProgramForm } from "@/components/manage/custom-program-form";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getEditableCustomPrograms } from "@/lib/data/queries";
import { requireWorkspace } from "@/lib/manage/access";

export default async function CustomProgramsPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;
  const programs = await getEditableCustomPrograms();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">Custom programs</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Published programs appear as cards below the FAQ on the FAQ &amp; About page. Use one card for a program such as a bake sale.
      </p>
      <div className="mt-8 grid gap-6">
        <CustomProgramForm program={null} events={access.workspace.events} mediaHosts={access.workspace.mediaHosts} />
        {programs.map((program) => (
          <CustomProgramForm
            key={program.id}
            program={program}
            events={access.workspace.events}
            mediaHosts={access.workspace.mediaHosts}
          />
        ))}
      </div>
    </div>
  );
}
