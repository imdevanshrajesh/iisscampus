import { ManageFacultyList } from "@/components/manage/manage-faculty-list";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getEditableFaculty } from "@/lib/data/queries";
import { requireWorkspace } from "@/lib/manage/access";

export default async function FacultyManagePage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  const faculty = await getEditableFaculty();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            School Leadership
          </p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-ink">
            Faculty Directory
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            Manage the Principal&apos;s featured message and portrait, Vice Principals, Headmistress &amp; Headmaster, and Supervisors stored in the database.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ManageFacultyList faculty={faculty.items} tableMissing={faculty.tableMissing} />
      </div>
    </div>
  );
}
