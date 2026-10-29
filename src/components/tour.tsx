"use client";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Eye, Hand, Search, X } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { BADGES, TOURS, tourKey, type TourBadge, type TourStep } from "@/lib/tours";
import { cn } from "@/lib/utils";

type Ctx = { start: () => void; available: boolean };
const TourCtx = createContext<Ctx>({ start: () => {}, available: false });
export const useTour = () => useContext(TourCtx);

const SEEN = (key: string) => `ace-tour:${key}`;
const seen = (key: string) => {
  try {
    return localStorage.getItem(SEEN(key)) === "1";
  } catch {
    return true; // xotira yo'q bo'lsa — har safar ochilib bezor qilmasin
  }
};
const markSeen = (key: string) => {
  try {
    localStorage.setItem(SEEN(key), "1");
  } catch {}
};

/** Sahifadagi ko'rinib turgan birinchi data-tour elementi (mobil/kompyuter navigatsiyasi ikkalasi bo'lishi mumkin). */
function findTarget(name?: string): HTMLElement | null {
  if (!name) return null;
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

/** Darsliklar: yangi foydalanuvchiga har bir oyna bir marta, keyin ? tugmasi bilan qayta. */
export function TourProvider({ children }: { children: ReactNode }) {
  const path = usePathname();
  const key = tourKey(path);
  // path bilan saqlanadi: boshqa sahifaga o'tilsa eski darslik o'zi yo'qoladi
  const [active, setActive] = useState<{ key: string; path: string; steps: TourStep[] } | null>(null);

  // Faqat sahifada bor elementlarga qadam (bo'sh sahifada ro'yxat yo'q bo'lishi mumkin); nishonsizlari qoladi
  const open = useCallback(
    (k: string) => {
      const steps = (TOURS[k] ?? []).filter((s) => !s.target || findTarget(s.target));
      if (steps.length) setActive({ key: k, path, steps });
    },
    [path],
  );

  useEffect(() => {
    if (!key || seen(key)) return;
    const id = setTimeout(() => open(key), 900);
    return () => clearTimeout(id);
  }, [key, open]);

  const start = useCallback(() => key && open(key), [key, open]);
  const close = useCallback(() => {
    setActive((a) => {
      if (a) markSeen(a.key);
      return null;
    });
  }, []);

  return (
    <TourCtx.Provider value={{ start, available: Boolean(key) }}>
      {children}
      {active?.path === path && <TourOverlay key={active.key} steps={active.steps} onClose={close} />}
    </TourCtx.Provider>
  );
}

const BADGE_STYLE: Record<TourBadge, [typeof Hand, string]> = {
  action: [Hand, "bg-[#fdefd9] text-[#b4570a] dark:bg-[#f5a524]/15 dark:text-[#f5b13d]"],
  watch: [Eye, "bg-neon/12 text-neon"],
  optional: [Search, "bg-fg/[0.07] text-muted"],
};

function Badge({ kind, lang }: { kind: TourBadge; lang: "uz" | "ru" }) {
  const [Icon, cls] = BADGE_STYLE[kind];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold", cls)}>
      <Icon className="size-4" />
      {BADGES[kind][lang]}
    </span>
  );
}

type Box = { top: number; left: number; width: number; height: number };
const PAD = 8;

function TourOverlay({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const { lang: siteLang } = useI18n();
  const [lang, setLang] = useState<"uz" | "ru">(siteLang === "ru" ? "ru" : "uz");
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [cardH, setCardH] = useState(0);
  const card = useRef<HTMLDivElement>(null);
  const step = steps[Math.min(i, steps.length - 1)];
  const last = i >= steps.length - 1;

  const measure = useCallback(() => {
    const el = findTarget(step.target);
    if (!el) return setBox(null);
    const r = el.getBoundingClientRect();
    setBox({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, [step]);

  useLayoutEffect(() => {
    const el = findTarget(step.target);
    if (el) {
      const r = el.getBoundingClientRect();
      // Uzun ro'yxat bo'lsa boshini ko'rsatamiz, kartaga joy qoldirib
      if (r.top < 80 || r.bottom > window.innerHeight - 120) el.scrollIntoView({ block: r.height > window.innerHeight * 0.5 ? "start" : "center" });
    }
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [step, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  useLayoutEffect(() => setCardH(card.current?.offsetHeight ?? 0), [step, lang, box]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((x) => Math.min(x + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(x - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, steps.length]);

  // Karta joyi: nishon ostida joy bo'lsa — pastda, bo'lmasa tepada; nishon yo'q bo'lsa — o'rtada
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  let pos: React.CSSProperties;
  if (!box) pos = { top: "50%", transform: "translateY(-50%)" };
  else {
    const below = box.top + box.height + 12;
    const above = box.top - 12 - cardH;
    const top = below + cardH <= vh - 12 ? below : above >= 12 ? above : Math.max(12, vh - cardH - 12);
    pos = { top };
  }

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
      {box ? (
        <div
          className="pointer-events-none fixed rounded-2xl ring-2 ring-white/90 transition-all duration-300"
          style={{ ...box, boxShadow: "0 0 0 9999px rgb(15 28 45 / 0.58)" }}
        />
      ) : (
        <div className="fixed inset-0 bg-[rgb(15_28_45/0.58)]" />
      )}
      {/* Orqa fonni bosish darslikni yopmaydi — tasodifan yopilib qolmasin */}
      <div className="fixed inset-0" />

      <div ref={card} className="fixed inset-x-3 mx-auto max-w-md animate-[fade-in_.2s_ease-out] transition-[top] duration-300" style={pos}>
        <div className="rounded-[1.75rem] bg-white p-5 text-[#102a43] shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)] dark:bg-[#13243a] dark:text-[#e6eef7]">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-[#8fa3b5]">
              {i + 1} / {steps.length}
            </span>
            <div className="ml-auto flex rounded-full bg-[#eef3f8] p-0.5 text-xs font-bold dark:bg-white/10">
              {(["uz", "ru"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={cn("rounded-full px-2.5 py-1 uppercase transition", lang === l ? "bg-white text-[#102a43] shadow-sm dark:bg-white/20 dark:text-white" : "text-[#8fa3b5]")}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-[#eef3f8] text-[#5b7083] dark:bg-white/10 dark:text-white/70" aria-label={lang === "ru" ? "Закрыть" : "Yopish"}>
              <X className="size-4" />
            </button>
          </div>

          {step.badge && (
            <div className="mt-4">
              <Badge kind={step.badge} lang={lang} />
            </div>
          )}
          <h2 className="mt-3 text-[19px] font-extrabold leading-tight tracking-tight">{step.title[lang]}</h2>
          {step.text && <p className="mt-2 text-sm leading-relaxed text-[#5b7083] dark:text-white/70">{step.text[lang]}</p>}
          {step.legend && (
            <div className="mt-3 space-y-2.5">
              {(
                [
                  ["action", { uz: "Bu yerda biror narsa bosishingiz yoki kiritishingiz kerak.", ru: "Здесь нужно что-то нажать или ввести." }],
                  ["watch", { uz: "Shunchaki ko'rib chiqing, hech narsa qilish shart emas.", ru: "Просто посмотрите, ничего делать не нужно." }],
                  ["optional", { uz: "Ixtiyoriy — kerak bo'lgandagina ishlating.", ru: "Необязательно — используйте при необходимости." }],
                ] as const
              ).map(([k, txt]) => (
                <div key={k} className="flex flex-col items-start gap-1">
                  <Badge kind={k} lang={lang} />
                  <span className="pl-1 text-sm text-[#5b7083] dark:text-white/70">{txt[lang]}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <div className="flex flex-1 flex-wrap gap-1.5">
              {steps.map((_, k) => (
                <span key={k} className={cn("h-2 rounded-full transition-all", k === i ? "w-5 bg-[#1d5c8d] dark:bg-[#4a9be0]" : k < i ? "w-2 bg-[#e8792b]" : "w-2 bg-[#cfdae6] dark:bg-white/20")} />
              ))}
            </div>
            {i > 0 && (
              <button onClick={() => setI(i - 1)} className="grid size-12 place-items-center rounded-full bg-[#eef3f8] text-[#102a43] dark:bg-white/10 dark:text-white" aria-label={lang === "ru" ? "Назад" : "Orqaga"}>
                <ArrowLeft className="size-5" />
              </button>
            )}
            <button
              onClick={() => (last ? onClose() : setI(i + 1))}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1d5c8d] px-5 text-[15px] font-bold text-white transition active:scale-95 dark:bg-[#4a9be0]"
            >
              {last ? (lang === "ru" ? "Понятно" : "Tushunarli") : lang === "ru" ? "Далее" : "Keyingi"}
              {!last && <ArrowRight className="size-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
