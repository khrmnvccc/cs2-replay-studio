import { redirect } from "next/navigation";
import { Logo } from "@/components/brand";
import { AppChrome, BottomNav, HeaderActions, PageTitle, SideNav } from "@/components/app/chrome";
import { LangSwitch, ThemeToggle } from "@/components/prefs";
import { SetupRequired } from "@/components/setup-required";
import { getT } from "@/lib/i18n/server";
import { envStatus } from "@/lib/server/env";
import { getSession, isOwner } from "@/lib/server/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const status = envStatus();
  if (!status.ok) return <SetupRequired missing={status.missing} />;
  const user = await getSession();
  const { t } = await getT();
  if (!user) redirect("/?auth_error=" + encodeURIComponent(t("Davom etish uchun Steam orqali kiring")));
  const chromeUser = { name: user.personaName, avatarUrl: user.avatarUrl, historyEnabled: user.historyEnabled, owner: isOwner(user) };

  return (
    <AppChrome user={chromeUser}>
      <div className="relative min-h-screen">
        <aside className="fixed inset-y-3 left-3 z-30 hidden w-64 flex-col rounded-3xl glass px-3 py-5 lg:flex">
          <Logo href="/matches" className="px-3" />
          <div className="mt-8 flex-1 overflow-y-auto">
            <SideNav />
          </div>
          <div className="flex items-center gap-2">
            <LangSwitch className="flex-1" />
            <ThemeToggle />
          </div>
        </aside>

        <div className="lg:pl-[17.5rem]">
          <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:px-10 lg:pt-6">
              <PageTitle />
              <HeaderActions />
            </div>
          </header>
          <main className="relative pb-28 lg:pb-12">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-10 lg:py-6">{children}</div>
          </main>
        </div>
        <BottomNav />
      </div>
    </AppChrome>
  );
}
