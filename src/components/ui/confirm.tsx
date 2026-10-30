"use client";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { tc } from "@/components/i18n";
import { cn } from "@/lib/utils";

type Req = { message: string; ok: string; danger: boolean; resolve: (v: boolean) => void };
let show: ((r: Req) => void) | null = null;

/** Brauzerning kulrang confirm() oynasi o'rniga — ilova uslubidagi tasdiqlash oynasi. */
export function askConfirm(message: string, opts: { ok?: string; danger?: boolean } = {}): Promise<boolean> {
  return new Promise((resolve) => {
    if (!show) return resolve(window.confirm(message));
    show({ message, ok: opts.ok ?? tc("Ha"), danger: opts.danger ?? true, resolve });
  });
}

export function ConfirmHost() {
  const [req, setReq] = useState<Req | null>(null);
  useEffect(() => {
    show = setReq;
    return () => {
      show = null;
    };
  }, []);
  const done = useCallback(
    (v: boolean) => {
      req?.resolve(v);
      setReq(null);
    },
    [req],
  );
  useEffect(() => {
    if (!req) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && done(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [req, done]);
  if (!req) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 animate-[fade-in_.15s_ease-out] bg-[rgb(15_28_45/0.58)]" onClick={() => done(false)} />
      <div className="relative w-full max-w-sm animate-[slide-in_.25s_cubic-bezier(.2,.8,.2,1)] rounded-[1.75rem] bg-surface p-5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)]">
        <span className={cn("grid size-12 place-items-center rounded-2xl", req.danger ? "bg-danger/10 text-danger" : "bg-neon/10 text-neon")}>
          <AlertTriangle className="size-6" />
        </span>
        <p className="mt-4 text-[15px] font-semibold leading-snug">{req.message}</p>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button onClick={() => done(false)} className="h-11 rounded-2xl bg-fg/[0.06] text-sm font-bold transition active:scale-95">
            {tc("Bekor qilish")}
          </button>
          <button autoFocus onClick={() => done(true)} className={cn("h-11 rounded-2xl text-sm font-bold text-white transition active:scale-95", req.danger ? "bg-danger" : "bg-neon")}>
            {req.ok}
          </button>
        </div>
      </div>
    </div>
  );
}
