"use client";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Pastdan chiqadigan oyna (telefon ilovalaridagi kabi); kompyuterda o'ng tomonda. */
export function Sheet({
  open,
  onOpenChange,
  title,
  actions,
  children,
  closeLabel = "Yopish",
  className,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  closeLabel?: string;
  className?: string;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-slate-950/50 data-[state=open]:animate-[fade-in_0.2s_ease-out]" />
        <D.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-[1.75rem] border border-line bg-bg shadow-2xl outline-none data-[state=open]:animate-[sheet-up_0.28s_cubic-bezier(0.2,0.8,0.2,1)]",
            "lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-4 lg:max-h-none lg:w-[26rem] lg:rounded-[1.75rem] lg:data-[state=open]:animate-[fade-in_0.2s_ease-out]",
            className,
          )}
        >
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-fg/15 lg:hidden" />
          <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-3">
            <D.Title className="flex-1 truncate text-xl font-bold tracking-tight">{title}</D.Title>
            {actions}
            <D.Close className="grid size-10 place-items-center rounded-full bg-fg/[0.06] text-muted transition hover:text-fg" aria-label={closeLabel}>
              <X className="size-5" />
            </D.Close>
          </div>
          <D.Description className="sr-only">{title}</D.Description>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

/** Ro'yxat guruhi (iOS sozlamalari uslubida). */
export function ListGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="mt-4 first:mt-1">
      {label && <div className="label mb-2 px-2">{label}</div>}
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface-2">{children}</div>
    </div>
  );
}
