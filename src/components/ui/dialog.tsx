"use client";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Dialog({ open, onOpenChange, title, children, className, closeLabel = "Yopish" }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode; className?: string; closeLabel?: string }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md data-[state=open]:animate-fade-up" />
        <D.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-3xl overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-glass-edge bg-surface p-4 shadow-2xl outline-none backdrop-blur-2xl sm:p-5",
            className,
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-4">
            <D.Title className="truncate font-display text-lg font-semibold">{title}</D.Title>
            <D.Close className="grid size-8 place-items-center rounded-lg text-muted hover:bg-fg/5 hover:text-fg" aria-label={closeLabel}>
              <X className="size-4" />
            </D.Close>
          </div>
          <D.Description className="sr-only">{title}</D.Description>
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
