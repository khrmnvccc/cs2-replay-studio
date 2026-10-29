import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("panel", className)} {...p} />;
}

export function SectionTitle({ eyebrow, title, action, className }: { eyebrow?: string; title: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="label mb-1.5">{eyebrow}</div>}
        <h2 className="font-display text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const badgeTones = {
  neutral: "bg-fg/5 text-muted border-line",
  neon: "bg-neon/10 text-neon border-neon/25",
  violet: "bg-violet/10 text-violet border-violet/25",
  danger: "bg-danger/10 text-danger border-danger/25",
  warn: "bg-warn/10 text-warn border-warn/25",
  ct: "bg-ct/10 text-ct border-ct/25",
  t: "bg-tside/10 text-tside border-tside/25",
} as const;

export function Badge({ tone = "neutral", className, ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTones }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium [&_svg]:size-3", badgeTones[tone], className)}
      {...p}
    />
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-base text-fg sm:text-sm placeholder:text-subtle outline-none transition focus:border-ct/60 focus:bg-surface focus:ring-4 focus:ring-ct/15";

export function Input({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...p} />;
}

export function Select({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClass, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238a919b%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:14px] bg-[right_0.75rem_center] bg-no-repeat pr-9", className)} {...p}>
      {children}
    </select>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-fg/90">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-relaxed text-muted">{hint}</span>}
    </label>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-fg/10", className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-neon-dim to-neon transition-[width] duration-500" style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center backdrop-blur-xl">
      {icon && <div className="mb-4 grid size-12 place-items-center rounded-2xl border border-line bg-surface-2 text-muted [&_svg]:size-5">{icon}</div>}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "neutral", title, children, className }: { tone?: "neutral" | "warn" | "danger" | "neon" | "violet"; title?: string; children: React.ReactNode; className?: string }) {
  const tones = {
    neutral: "border-line-strong bg-surface-2/60",
    warn: "border-warn/25 bg-warn/[0.06]",
    danger: "border-danger/25 bg-danger/[0.06]",
    neon: "border-neon/25 bg-neon/[0.05]",
    violet: "border-violet/25 bg-violet/[0.06]",
  };
  const titleTones = { neutral: "text-fg", warn: "text-warn", danger: "text-danger", neon: "text-neon", violet: "text-violet" };
  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm leading-relaxed text-muted backdrop-blur-xl", tones[tone], className)}>
      {title && <div className={cn("mb-0.5 font-medium", titleTones[tone])}>{title}</div>}
      {children}
    </div>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: boolean }) {
  return (
    <div className="panel relative overflow-hidden p-4 sm:p-5">
      <div className="label">{label}</div>
      <div className={cn("mt-2 font-display text-2xl font-bold tabular-nums tracking-tight sm:text-3xl", accent ? "text-neon" : "text-fg")}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
