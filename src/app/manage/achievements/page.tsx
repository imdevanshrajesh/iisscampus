import { ManageAchievementsList } from "@/components/manage/manage-achievements-list";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { requireWorkspace } from "@/lib/manage/access";

export default async function ManageAchievementsPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Hall of Fame</p>
          <h1 className="text-3xl font-medium tracking-tight text-ink mt-1">Achievements</h1>
          <p className="mt-1 text-sm text-muted">
            Track inter-school trophies, tournament honors, and student commendations.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ManageAchievementsList
          achievements={access.workspace.achievements}
          categories={access.workspace.categories}
          events={access.workspace.events}
          role={access.role}
          mediaHosts={access.workspace.mediaHosts}
        />
      </div>
    </div>
  );
}
