import Link from "next/link";
import { LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/", sub = "CS2 match studio" }: { className?: string; href?: string; sub?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-3", className)}>
      <span className="relative grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-neon to-[#0ea5e9] text-white shadow-[0_8px_20px_-8px_rgb(22_163_74/0.6)]">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 2v5M12 17v5M2 12h5M17 12h5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight text-fg">Replay Studio</span>
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
