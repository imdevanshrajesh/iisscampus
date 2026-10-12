import { Wordmark } from "@/components/brand/wordmark";
import { ManageNav } from "@/components/manage/manage-nav";
import { signOut } from "@/lib/manage/actions";
import { getCampusActor } from "@/lib/auth/session";
import { getSiteBrand } from "@/lib/data/queries";

export async function ManageBar() {
  const [actor, brand] = await Promise.all([getCampusActor(), getSiteBrand()]);

  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Wordmark href="/manage" tone="paper" logoUrl={brand.councilLogoUrl} />
        {actor ? (
          <div className="flex flex-wrap items-center gap-3">
            <ManageNav showSettings={actor.role === "administrator"} />
            <form action={signOut}>
              <button type="submit" className="rounded-full px-3 py-1.5 text-sm text-white/70">
                Sign out
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
