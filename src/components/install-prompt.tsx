"use client";
import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useT } from "@/components/i18n";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "ace-install-dismissed";
const DISMISS_DAYS = 3;

function wasDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Saytga kirganda "ACE ilovasini yuklab oling" oynasi (Android/kompyuter: o'rnatish tugmasi, iPhone: ko'rsatma). */
export function InstallPrompt() {
  const t = useT();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"hidden" | "native" | "ios">("hidden");

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (isStandalone() || wasDismissed()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("native");
    };
    const onInstalled = () => setMode("hidden");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iPhone/iPad Safari o'rnatish oynasini bermaydi — qo'lda qo'shish ko'rsatmasi
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    const timer = ios ? window.setTimeout(() => setMode("ios"), 1200) : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setMode("hidden");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setMode("hidden");
    else dismiss();
  }

  if (mode === "hidden") return null;
  return (
    <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-md lg:bottom-6 lg:w-[26rem] lg:right-6 lg:left-auto lg:mx-0">
      <div className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-3 pr-2 shadow-[0_20px_50px_-15px_rgb(16_42_67/0.35)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={48} height={48} className="size-12 shrink-0 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">{t("ACE ilovasini yuklab oling")}</p>
          <p className="text-xs leading-snug text-muted">
            {mode === "ios" ? (
              <>
                {t("Safari'da pastdagi")} <Share className="inline size-3.5 -translate-y-px" /> {t("tugmasini bosing va «Bosh ekranga qo'shish»ni tanlang")}
              </>
            ) : (
              t("Telefoningizga o'rnating: tez ochiladi va alohida ilova bo'lib ishlaydi")
            )}
          </p>
        </div>
        {mode === "native" && (
          <button onClick={install} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-2xl bg-neon px-3.5 text-sm font-semibold text-on-neon hover:bg-neon-dim">
            <Download className="size-4" />
            {t("Yuklab olish")}
          </button>
        )}
        <button onClick={dismiss} aria-label={t("Yopish")} className="grid size-9 shrink-0 place-items-center rounded-xl text-subtle hover:bg-surface-3 hover:text-fg">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
