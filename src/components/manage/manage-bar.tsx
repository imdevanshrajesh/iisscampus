import { Wordmark } from "@/components/brand/wordmark";
import { ManageNav } from "@/components/manage/manage-nav";
import { FloatingManageAi } from "@/components/manage/floating-manage-ai";
import { ManageThemeProvider, ManageThemeToggle } from "@/components/manage/manage-theme";
import { signOut } from "@/lib/manage/actions";
import { getCampusActor } from "@/lib/auth/session";
import { getSiteBrand, getAiConfig, getPublicCatalog } from "@/lib/data/queries";

export async function ManageBar({ children }: { children: React.ReactNode }) {
  const [actor, brand, aiConfig, catalog] = await Promise.all([
    getCampusActor(),
    getSiteBrand(),
    getAiConfig(),
    getPublicCatalog(),
  ]);

  if (!actor) {
    return (
      <ManageThemeProvider>
        <div className="min-h-dvh">
          <header className="border-b border-white/10 bg-navy text-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
              <Wordmark href="/manage/login" tone="paper" logoUrl={brand.councilLogoUrl} />
              <ManageThemeToggle variant="compact" />
            </div>
          </header>
          {children}
        </div>
      </ManageThemeProvider>
    );
  }

  return (
    <ManageThemeProvider>
      <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-[#12141c] text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r lg:border-white/10">
          <div className="flex items-center justify-between gap-4 px-5 py-5">
            <Wordmark href="/manage" tone="paper" logoUrl={brand.councilLogoUrl} />
            <div className="flex items-center gap-2 lg:hidden">
              <ManageThemeToggle variant="compact" />
              <form action={signOut}>
                <button type="submit" className="text-sm text-white/70">
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <ManageNav showSettings={actor.role === "administrator"} />
          <div className="mt-auto hidden border-t border-white/10 px-5 py-4 lg:block space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">{actor.role}</p>
              <form action={signOut}>
                <button type="submit" className="text-xs text-white/80 hover:text-white transition-colors">
                  Sign out
                </button>
              </form>
            </div>
            <ManageThemeToggle variant="sidebar" />
          </div>
        </aside>
        <div className="min-w-0 relative">
          {children}
          <FloatingManageAi
            initialProvider={aiConfig.provider}
            initialApiKey={aiConfig.apiKey ?? ""}
            initialModel={aiConfig.model}
            initialBaseUrl={aiConfig.baseUrl ?? ""}
            categories={catalog.categories}
          />
        </div>
      </div>
    </ManageThemeProvider>
  );
}
