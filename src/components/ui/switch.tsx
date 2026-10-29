"use client";
import { cn } from "@/lib/utils";

export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60", checked ? "bg-neon" : "bg-fg/15")}
    >
      <span className={cn("absolute top-1 size-6 rounded-full bg-white shadow transition-all", checked ? "left-7" : "left-1")} />
    </button>
  );
}
