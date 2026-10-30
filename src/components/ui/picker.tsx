"use client";
import { useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useT } from "@/components/i18n";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type PickerOption<T extends string | number> = { value: T; label: string; hint?: string; icon?: ReactNode };

/** Telefonning tizim ro'yxati o'rniga: pastdan chiqadigan, ilova uslubidagi tanlash oynasi. */
export function Picker<T extends string | number>({
  value,
  options,
  onChange,
  title,
  icon,
  className,
  center,
}: {
  value: T;
  options: PickerOption<T>[];
  onChange: (v: T) => void;
  title: string;
  icon?: ReactNode;
  className?: string;
  center?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={title}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-2xl bg-surface px-4 text-sm font-semibold shadow-[0_4px_14px_-10px_rgb(16_42_67/0.4)] ring-1 ring-line transition active:scale-[0.99]",
          center && "justify-center",
          className,
        )}
      >
        {icon && <span className="text-muted [&_svg]:size-4">{icon}</span>}
        <span className={cn("truncate", !center && "flex-1 text-left")}>{current?.label}</span>
        <ChevronDown className="size-4 shrink-0 text-muted" />
      </button>
      <Sheet open={open} onOpenChange={setOpen} title={title} closeLabel={t("Yopish")}>
        <div className="divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-[0_6px_18px_-14px_rgb(16_42_67/0.35)]">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={String(o.value)}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (!active) onChange(o.value);
                }}
                className={cn("flex w-full items-center gap-3 px-4 py-3.5 text-left transition", active ? "bg-neon/[0.06]" : "hover:bg-fg/[0.03]")}
              >
                {o.icon}
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm", active ? "font-bold text-neon" : "font-medium")}>{o.label}</span>
                  {o.hint && <span className="mt-0.5 block text-xs text-muted">{o.hint}</span>}
                </span>
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", active ? "bg-neon text-on-neon" : "ring-2 ring-line-strong")}>{active && <Check className="size-3.5" strokeWidth={3} />}</span>
              </button>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
