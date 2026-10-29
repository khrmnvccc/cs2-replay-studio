"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, LayoutDashboard, ListVideo, Server, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n";

const SECTIONS = [
  {
    title: "Asosiy",
    items: [
      { href: "/dashboard", label: "Bosh sahifa", short: "Asosiy", icon: LayoutDashboard },
      { href: "/matches", label: "Matchlar", short: "Matchlar", icon: ListVideo },
      { href: "/clips", label: "Kliplarim", short: "Kliplar", icon: Clapperboard },
    ],
  },
  {
    title: "Boshqaruv",
    items: [
      { href: "/settings", label: "Sozlamalar", short: "Sozlama", icon: Settings },
      { href: "/system", label: "Tizim holati", short: "Tizim", icon: Server },
    ],
  },
];
const ALL = SECTIONS.flatMap((s) => s.items);

const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

export function SideNav({ owner = false }: { owner?: boolean }) {
  const path = usePathname();
  const t = useT();
  return (
    <nav className="space-y-6">
      {SECTIONS.map((sec) => ({ ...sec, items: sec.items.filter((i) => owner || i.href !== "/system") })).map((sec) => (
        <div key={sec.title}>
          <div className="label mb-2 px-3">{t(sec.title)}</div>
          <div className="flex flex-col gap-0.5">
            {sec.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(path, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                    active ? "bg-fg/[0.07] text-fg" : "text-muted hover:bg-fg/[0.04] hover:text-fg",
                  )}
                >
                  <Icon className={cn("size-[18px]", active ? "text-fg" : "text-subtle group-hover:text-muted")} />
                  {t(label)}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function BottomNav({ owner = false }: { owner?: boolean }) {
  const path = usePathname();
  const t = useT();
  const items = ALL.filter((i) => owner || i.href !== "/system");
  return (
    <nav style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }} className="glass fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid rounded-3xl p-1.5 lg:hidden">
      {items.map(({ href, short, icon: Icon }) => {
        const active = isActive(path, href);
        return (
          <Link key={href} href={href} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-2xl py-2 text-[10.5px] font-medium transition", active ? "bg-neon/12 text-neon" : "text-muted")}>
            <Icon className="size-[18px]" />
            <span className="max-w-full truncate px-0.5">{t(short)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
