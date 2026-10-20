import Link from "next/link";
import { LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-8 place-items-center rounded-lg border border-neon/30 bg-neon/10">
        <svg viewBox="0 0 24 24" className="size-[18px] text-neon" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 2v5M12 17v5M2 12h5M17 12h5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="font-display text-[17px] font-bold uppercase leading-none tracking-[0.08em]">
        Replay<span className="text-neon">Studio</span>
      </span>
    </Link>
  );
}

export function SteamSignInButton({ className, label = "Sign in through Steam" }: { className?: string; label?: string }) {
  // Oddiy <a>: OpenID redirect server tomonda boshlanadi (/api/auth/steam/login)
  return (
    <a
      href="/api/auth/steam/login"
      className={cn(
        "group relative inline-flex h-12 items-center gap-3 overflow-hidden rounded-xl bg-neon px-5 text-[15px] font-semibold text-black transition-all duration-200",
        "shadow-[0_0_0_1px_rgba(180,255,46,0.45),0_14px_44px_-12px_rgba(180,255,46,0.7)] hover:bg-[#c6ff5c] hover:shadow-[0_0_0_1px_rgba(180,255,46,0.7),0_18px_54px_-12px_rgba(180,255,46,0.85)] active:translate-y-px",
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-scan" />
      <LogIn className="size-5" />
      {label}
    </a>
  );
}
