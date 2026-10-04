import { notFound } from "next/navigation";
import { AchievementForm } from "@/components/manage/achievement-form";
import { DeleteRecord } from "@/components/manage/delete-record";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { canDelete } from "@/lib/auth/permissions";
import { deleteAchievement } from "@/lib/manage/actions";
import { requireWorkspace } from "@/lib/manage/access";

export default async function EditAchievementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;
  const achievement = access.workspace.achievements.find((item) => item.id === id);
  if (!achievement) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{achievement.publicationStatus.replace("_", " ")}</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">{achievement.title}</h1>
      <p className="mt-2 text-sm text-muted">Published results stay editable. Save changes, or unpublish if it should leave the site.</p>
      <div className="mt-8">
        <AchievementForm
          achievement={achievement}
          categories={access.workspace.categories}
          events={access.workspace.events}
          role={access.role}
          mediaHosts={access.workspace.mediaHosts}
        />
      </div>
      {canDelete({ userId: "staff", role: access.role }, achievement.publicationStatus) ? (
        <div className="mt-10 border-t border-line pt-6">
          <h2 className="text-lg font-medium">Delete this result</h2>
          <div className="mt-4">
            <DeleteRecord action={deleteAchievement} id={achievement.id} label="Delete result" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
