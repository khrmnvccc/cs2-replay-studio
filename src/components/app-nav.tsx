"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Gauge, ListVideo, Server, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Bosh sahifa", short: "Asosiy", icon: Gauge },
  { href: "/matches", label: "Matchlar", short: "Matchlar", icon: ListVideo },
  { href: "/clips", label: "Kliplarim", short: "Kliplar", icon: Clapperboard },
  { href: "/settings", label: "Sozlamalar", short: "Sozlama", icon: Settings },
  { href: "/system", label: "Tizim holati", short: "Tizim", icon: Server },
];

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-white/[0.06] text-fg" : "text-muted hover:bg-white/[0.03] hover:text-fg",
            )}
          >
            {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-neon shadow-[0_0_12px_rgba(180,255,46,0.8)]" />}
            <Icon className={cn("size-[18px]", active ? "text-neon" : "text-subtle group-hover:text-muted")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="glass fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-5 rounded-2xl p-1.5 lg:hidden">
      {NAV.map(({ href, short, icon: Icon }) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-xl py-2 text-[10.5px] font-medium", active ? "bg-white/[0.07] text-neon" : "text-muted")}>
            <Icon className="size-[18px]" />
            <span className="max-w-full truncate px-0.5">{short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
