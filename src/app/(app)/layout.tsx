import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand";
import { BottomNav, SideNav } from "@/components/app-nav";
import { SetupRequired } from "@/components/setup-required";
import { envStatus } from "@/lib/server/env";
import { getSession } from "@/lib/server/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const status = envStatus();
  if (!status.ok) return <SetupRequired missing={status.missing} />;
  const user = await getSession();
  if (!user) redirect("/?auth_error=" + encodeURIComponent("Davom etish uchun Steam orqali kiring"));

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_70%_0%,rgba(143,107,255,0.10),transparent_70%),radial-gradient(40%_80%_at_10%_0%,rgba(180,255,46,0.06),transparent_70%)]" />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-bg/80 px-4 py-6 backdrop-blur-xl lg:flex">
        <Logo href="/dashboard" className="px-2" />
        <div className="mt-10 flex-1">
          <SideNav />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-3">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt="" width={36} height={36} className="rounded-lg" unoptimized />
            ) : (
              <div className="size-9 rounded-lg bg-surface-3" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user.personaName}</div>
              <div className="truncate font-mono text-[10.5px] text-subtle">{user.steamId64}</div>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-white/5 hover:text-danger" aria-label="Chiqish" title="Chiqish">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo href="/dashboard" />
        {user.avatarUrl && <Image src={user.avatarUrl} alt="" width={32} height={32} className="rounded-lg" unoptimized />}
      </header>
      <main className="relative pb-28 lg:pb-12 lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
