import Link from "next/link";
import { LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/", sub = "CS2 match studio" }: { className?: string; href?: string; sub?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="ACE" width={40} height={40} className="size-10 rounded-2xl object-cover shadow-[0_8px_20px_-8px_rgb(0_0_0/0.45)] ring-1 ring-black/5" />
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight text-fg">ACE</span>
        <span className="block text-[10.5px] font-medium uppercase tracking-[0.14em] text-subtle">{sub}</span>
      </span>
    </Link>
  );
}

export function SteamSignInButton({ className, label = "Steam orqali kirish" }: { className?: string; label?: string }) {
  // Oddiy <a>: OpenID redirect server tomonda boshlanadi (/api/auth/steam/login)
  return (
    <a
      href="/api/auth/steam/login"
      className={cn(
        "group relative inline-flex h-12 items-center gap-3 overflow-hidden rounded-2xl bg-neon px-6 text-[15px] font-semibold text-on-neon transition-all duration-200",
        "shadow-[0_12px_30px_-10px_color-mix(in_oklab,var(--color-neon)_75%,transparent)] hover:bg-neon-dim active:translate-y-px",
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-scan" />
      <LogIn className="size-5" />
      {label}
    </a>
  );
}
