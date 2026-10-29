import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand";
import { BottomNav, SideNav } from "@/components/app-nav";
import { LangSwitch, ThemeToggle } from "@/components/prefs";
import { SetupRequired } from "@/components/setup-required";
import { getT } from "@/lib/i18n/server";
import { envStatus } from "@/lib/server/env";
import { getSession, isOwner } from "@/lib/server/session";
import { formatLongDate } from "@/lib/utils";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const status = envStatus();
  if (!status.ok) return <SetupRequired missing={status.missing} />;
  const user = await getSession();
  const { lang, t } = await getT();
  if (!user) redirect("/?auth_error=" + encodeURIComponent(t("Davom etish uchun Steam orqali kiring")));
  const owner = isOwner(user);

  const logout = (
    <form action="/api/auth/logout" method="post">
      <button className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-fg/5 hover:text-danger" aria-label={t("Chiqish")} title={t("Chiqish")}>
        <LogOut className="size-[18px]" />
      </button>
    </form>
  );

  return (
    <div className="relative min-h-screen">
      <aside className="fixed inset-y-3 left-3 z-30 hidden w-64 flex-col rounded-3xl glass px-3 py-5 lg:flex">
        <Logo href="/dashboard" className="px-3" />
        <div className="mt-8 flex-1 overflow-y-auto">
          <SideNav owner={owner} />
        </div>
        <LangSwitch className="mb-3" />
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-2.5">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="" width={36} height={36} className="rounded-full" unoptimized />
          ) : (
            <div className="size-9 rounded-full bg-surface-3" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user.personaName}</div>
            <div className="truncate text-[11px] text-subtle">Steam</div>
          </div>
          {logout}
        </div>
      </aside>

      <div className="lg:pl-[17.5rem]">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/60 backdrop-blur-xl lg:static lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10 lg:pt-6">
            <div className="lg:hidden">
              <Logo href="/dashboard" />
            </div>
            <div className="hidden text-sm text-muted lg:block">{formatLongDate(new Date(), lang)}</div>
            <div className="flex items-center gap-2">
              <LangSwitch className="w-24 lg:hidden" />
              <ThemeToggle />
              <div className="lg:hidden">{logout}</div>
            </div>
          </div>
        </header>
        <main className="relative pb-28 lg:pb-12">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10 lg:py-6">{children}</div>
        </main>
      </div>
      <BottomNav owner={owner} />
    </div>
  );
}
