import { Wordmark } from "@/components/brand/wordmark";
import { ManageNav } from "@/components/manage/manage-nav";
import { signOut } from "@/lib/manage/actions";
import { getCampusActor } from "@/lib/auth/session";
import { getSiteBrand } from "@/lib/data/queries";

export async function ManageBar({ children }: { children: React.ReactNode }) {
  const [actor, brand] = await Promise.all([getCampusActor(), getSiteBrand()]);

  if (!actor) {
    return (
      <div className="min-h-dvh bg-[#f4f1e6]">
        <header className="border-b border-white/10 bg-navy text-white">
          <div className="mx-auto flex max-w-6xl px-5 py-4 md:px-8">
            <Wordmark href="/manage/login" tone="paper" logoUrl={brand.councilLogoUrl} />
          </div>
        </header>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f4f1e6] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="border-b border-white/10 bg-navy text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-5">
          <Wordmark href="/manage" tone="paper" logoUrl={brand.councilLogoUrl} />
          <form action={signOut} className="lg:hidden">
            <button type="submit" className="text-sm text-white/70">
              Sign out
            </button>
          </form>
        </div>
        <ManageNav showSettings={actor.role === "administrator"} />
        <div className="mt-auto hidden border-t border-white/10 px-5 py-4 lg:block">
          <p className="text-xs uppercase tracking-[0.14em] text-white/45">{actor.role}</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="text-sm text-white/80 hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
