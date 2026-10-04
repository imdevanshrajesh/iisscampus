import Link from "next/link";
import { AchievementForm } from "@/components/manage/achievement-form";
import { DeleteRecord } from "@/components/manage/delete-record";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { canDelete } from "@/lib/auth/permissions";
import { deleteAchievement } from "@/lib/manage/actions";
import { requireWorkspace } from "@/lib/manage/access";

export default async function ManageAchievementsPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">Achievements</h1>
      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-background">
        {access.workspace.achievements.map((item) => (
          <li key={item.id} className="grid gap-4 px-4 py-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <Link href={`/manage/achievements/${item.id}/edit`} className="font-medium">
                {item.title}
              </Link>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">{item.publicationStatus.replace("_", " ")}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href={`/manage/achievements/${item.id}/edit`} className="text-sm text-accent">
                Edit
              </Link>
            {canDelete({ userId: "staff", role: access.role }, item.publicationStatus) ? (
              <DeleteRecord action={deleteAchievement} id={item.id} label="Delete" />
            ) : null}
            </div>
          </li>
        ))}
        {access.workspace.achievements.length === 0 ? (
          <li className="px-4 py-8 text-sm text-muted">No achievements yet.</li>
        ) : null}
      </ul>
      <h2 className="mt-12 text-xl font-medium">Add a result</h2>
      <div className="mt-4">
        <AchievementForm
          achievement={null}
          categories={access.workspace.categories}
          events={access.workspace.events}
          role={access.role}
          mediaHosts={access.workspace.mediaHosts}
        />
      </div>
    </div>
  );
}
